const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");
const { requireMembership } = require("../lib/membership");
const { sendWhatsAppMessage } = require("../lib/twilioClient");

const router = express.Router();

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

// RF-14/RF-16: envía un mensaje saliente en una conversación existente.
// Dentro de la ventana de servicio de 24h (desde el último mensaje entrante
// del contacto) se permite texto libre; fuera de ella, WhatsApp exige una
// plantilla aprobada — todavía no hay catálogo de plantillas construido, así
// que por ahora se bloquea con un error claro en vez de enviar algo que
// Twilio va a rechazar de todas formas.
router.post("/:id/messages", requireAuth, requireMembership, async (req, res) => {
  const content = (req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío." });
  }

  const { tenant_id: tenantId } = req.membership;

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("id, tenant_id, channels ( external_id, status ), contacts ( phone )")
    .eq("id", req.params.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (conversationError) return res.status(500).json({ error: conversationError.message });
  if (!conversation) return res.status(404).json({ error: "Conversación no encontrada." });
  if (!conversation.contacts?.phone) return res.status(422).json({ error: "El contacto de esta conversación no tiene teléfono registrado." });
  if (!conversation.channels?.external_id || conversation.channels.status !== "activo") {
    return res.status(422).json({ error: "Esta conversación no tiene un canal de WhatsApp conectado." });
  }

  const { data: lastInbound, error: lastInboundError } = await supabaseAdmin
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversation.id)
    .eq("direction", "entrante")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastInboundError) return res.status(500).json({ error: lastInboundError.message });

  const withinServiceWindow = lastInbound && Date.now() - new Date(lastInbound.created_at).getTime() < SERVICE_WINDOW_MS;
  if (!withinServiceWindow) {
    return res.status(422).json({
      error: "La ventana de 24 horas para mensaje libre expiró. Se necesita una plantilla aprobada por WhatsApp (todavía no disponible en el sistema).",
    });
  }

  let twilioMessage;
  try {
    twilioMessage = await sendWhatsAppMessage({
      from: conversation.channels.external_id,
      to: conversation.contacts.phone,
      body: content,
    });
  } catch (error) {
    return res.status(502).json({ error: `No se pudo enviar el mensaje por WhatsApp: ${error.message}` });
  }

  const { data: message, error: insertError } = await supabaseAdmin
    .from("messages")
    .insert({
      tenant_id: tenantId,
      conversation_id: conversation.id,
      direction: "saliente",
      type: "texto",
      content,
      sent_by: req.user.id,
      delivery_status: "enviado",
      external_message_id: twilioMessage.sid,
    })
    .select("id, direction, content, type, created_at")
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(201).json(message);
});

module.exports = router;
