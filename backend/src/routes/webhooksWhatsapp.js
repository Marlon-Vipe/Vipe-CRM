const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { stripWhatsAppPrefix, validateTwilioSignature } = require("../lib/twilioClient");

const router = express.Router();

// Twilio manda application/x-www-form-urlencoded, no JSON — el resto del
// backend usa express.json() global (ver server.js), así que este router
// necesita su propio parser.
router.use(express.urlencoded({ extended: false }));

async function findOrCreateContact(tenantId, phone) {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("contacts")
    .insert({ tenant_id: tenantId, name: phone, phone, source: "whatsapp" })
    .select("id")
    .single();

  if (insertError) {
    // 23505 = unique_violation: otro webhook casi simultáneo (reintento de
    // Twilio, o dos mensajes muy seguidos) ya creó este contacto primero —
    // ver constraint contacts_tenant_phone_unique. No es un error real,
    // devolvemos el que ganó la carrera (mismo patrón que invitations.js).
    if (insertError.code === "23505") {
      const { data: winner, error: refetchError } = await supabaseAdmin
        .from("contacts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("phone", phone)
        .single();
      if (refetchError) throw new Error(refetchError.message);
      return winner.id;
    }
    throw new Error(insertError.message);
  }
  return created.id;
}

async function findOrCreateConversation(tenantId, channelId, contactId) {
  const { data: existing, error: findError } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("channel_id", channelId)
    .eq("contact_id", contactId)
    .eq("status", "abierta")
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("conversations")
    .insert({ tenant_id: tenantId, channel_id: channelId, contact_id: contactId, status: "abierta" })
    .select("id")
    .single();

  if (insertError) {
    // Ver comentario equivalente en findOrCreateContact — respaldado por
    // conversations_tenant_channel_contact_open_unique.
    if (insertError.code === "23505") {
      const { data: winner, error: refetchError } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("channel_id", channelId)
        .eq("contact_id", contactId)
        .eq("status", "abierta")
        .single();
      if (refetchError) throw new Error(refetchError.message);
      return winner.id;
    }
    throw new Error(insertError.message);
  }
  return created.id;
}

// RF-15: Twilio reenvía aquí cada mensaje entrante de WhatsApp. Siempre
// respondemos 200 (incluso ante errores de negocio) para que Twilio no
// reintente indefinidamente un webhook que nunca va a poder resolverse;
// los errores reales quedan en el log del servidor.
router.post("/", async (req, res) => {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send("Firma de Twilio inválida.");
  }

  const toNumber = stripWhatsAppPrefix(req.body.To);
  const fromNumber = stripWhatsAppPrefix(req.body.From);
  const body = req.body.Body || null;
  const messageSid = req.body.MessageSid || null;

  try {
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("channels")
      .select("id, tenant_id")
      .eq("type", "whatsapp")
      .eq("provider", "bsp_twilio")
      .eq("external_id", toNumber)
      .eq("status", "activo")
      .maybeSingle();

    if (channelError) throw new Error(channelError.message);
    if (!channel) {
      // eslint-disable-next-line no-console
      console.warn(`Webhook de WhatsApp recibido para un número no registrado como canal: ${toNumber}`);
      return res.status(200).send();
    }

    const contactId = await findOrCreateContact(channel.tenant_id, fromNumber);
    const conversationId = await findOrCreateConversation(channel.tenant_id, channel.id, contactId);

    const { error: messageError } = await supabaseAdmin.from("messages").insert({
      tenant_id: channel.tenant_id,
      conversation_id: conversationId,
      direction: "entrante",
      type: "texto",
      content: body,
      delivery_status: "entregado",
      external_message_id: messageSid,
    });

    if (messageError) throw new Error(messageError.message);

    return res.status(200).send();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error al procesar webhook de WhatsApp:", error.message);
    return res.status(200).send();
  }
});

// Callback de estado de entrega de Twilio (sent/delivered/read/failed) para
// los mensajes que nosotros enviamos — reconcilia messages.delivery_status
// vía el external_message_id guardado al enviar.
router.post("/status", async (req, res) => {
  if (!validateTwilioSignature(req)) {
    return res.status(403).send("Firma de Twilio inválida.");
  }

  const messageSid = req.body.MessageSid;
  const statusMap = { sent: "enviado", delivered: "entregado", read: "leido", failed: "fallido", undelivered: "fallido" };
  const deliveryStatus = statusMap[req.body.MessageStatus];

  if (messageSid && deliveryStatus) {
    await supabaseAdmin.from("messages").update({ delivery_status: deliveryStatus }).eq("external_message_id", messageSid);
  }

  return res.status(200).send();
});

module.exports = router;
