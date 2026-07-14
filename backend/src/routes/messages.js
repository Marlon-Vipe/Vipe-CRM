const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");
const { requireMembership } = require("../lib/membership");
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require("../lib/twilioClient");

const router = express.Router();

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function isWithinServiceWindow(conversationId) {
  const { data: lastInbound, error } = await supabaseAdmin
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "entrante")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(lastInbound) && Date.now() - new Date(lastInbound.created_at).getTime() < SERVICE_WINDOW_MS;
}

async function sendAndRecord({ tenantId, conversation, userId, res, twilioCall, messagePayload }) {
  let twilioMessage;
  try {
    twilioMessage = await twilioCall();
  } catch (error) {
    return res.status(502).json({ error: `No se pudo enviar el mensaje por WhatsApp: ${error.message}` });
  }

  const { data: message, error: insertError } = await supabaseAdmin
    .from("messages")
    .insert({
      tenant_id: tenantId,
      conversation_id: conversation.id,
      direction: "saliente",
      sent_by: userId,
      delivery_status: "enviado",
      external_message_id: twilioMessage.sid,
      ...messagePayload,
    })
    .select("id, direction, content, type, created_at")
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });
  return res.status(201).json(message);
}

// RF-14/RF-16: envía un mensaje saliente en una conversación existente.
// Dentro de la ventana de servicio de 24h (desde el último mensaje entrante
// del contacto) se permite texto libre. Fuera de ella, WhatsApp exige una
// plantilla aprobada — el cliente manda `templateId` + `variables` en vez de
// `content`, y esa vía no depende de la ventana de servicio.
router.post("/:id/messages", requireAuth, requireMembership, async (req, res) => {
  const { templateId, variables } = req.body || {};
  const content = (req.body?.content || "").trim();

  if (!templateId && !content) {
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

  if (templateId) {
    const { data: template, error: templateError } = await supabaseAdmin
      .from("whatsapp_templates")
      .select("id, name, twilio_content_sid, variable_labels")
      .eq("id", templateId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (templateError) return res.status(500).json({ error: templateError.message });
    if (!template) return res.status(404).json({ error: "Plantilla no encontrada." });

    const providedVariables = Array.isArray(variables) ? variables.map(String) : [];
    if (providedVariables.length !== template.variable_labels.length) {
      return res.status(400).json({ error: `Esta plantilla necesita ${template.variable_labels.length} variable(s).` });
    }

    return sendAndRecord({
      tenantId,
      conversation,
      userId: req.user.id,
      res,
      twilioCall: () =>
        sendWhatsAppTemplate({
          from: conversation.channels.external_id,
          to: conversation.contacts.phone,
          contentSid: template.twilio_content_sid,
          variables: providedVariables,
        }),
      messagePayload: {
        type: "plantilla",
        template_name: template.name,
        content: providedVariables.length ? `[${template.name}] ${providedVariables.join(" · ")}` : `[${template.name}]`,
      },
    });
  }

  let withinWindow;
  try {
    withinWindow = await isWithinServiceWindow(conversation.id);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!withinWindow) {
    return res.status(422).json({
      error: "La ventana de 24 horas para mensaje libre expiró. Elige una plantilla aprobada para poder escribirle a este contacto.",
      requiresTemplate: true,
    });
  }

  return sendAndRecord({
    tenantId,
    conversation,
    userId: req.user.id,
    res,
    twilioCall: () =>
      sendWhatsAppMessage({
        from: conversation.channels.external_id,
        to: conversation.contacts.phone,
        body: content,
      }),
    messagePayload: { type: "texto", content },
  });
});

module.exports = router;
