const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");
const { requireMembership, requireOwnerOrAdmin } = require("../lib/membership");

const router = express.Router();

const PHONE_RE = /^\+[1-9]\d{6,14}$/;

router.get("/", requireAuth, requireMembership, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("channels")
    .select("id, type, provider, external_id, status, created_at")
    .eq("tenant_id", req.membership.tenant_id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// RF-13: conecta el número de WhatsApp Business de la agencia. No hace el
// flujo completo de Embedded Signup (fuera de alcance, ver sección 8 del
// prompt) — solo registra el número ya aprovisionado en la consola de
// Twilio (o el número del sandbox mientras se desarrolla) como
// `channels.external_id`, en formato E.164, para poder matchear los
// webhooks entrantes por el campo "To".
router.post("/whatsapp", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const phoneNumber = (req.body?.phone_number || "").trim();

  if (!PHONE_RE.test(phoneNumber)) {
    return res.status(400).json({ error: "Ingresa el número en formato internacional, ej. +18095551234." });
  }

  const { tenant_id: tenantId } = req.membership;

  const { data: existing, error: findError } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("type", "whatsapp")
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });

  const payload = { tenant_id: tenantId, type: "whatsapp", provider: "bsp_twilio", external_id: phoneNumber, status: "activo" };

  const { data: channel, error: upsertError } = existing
    ? await supabaseAdmin.from("channels").update(payload).eq("id", existing.id).select().single()
    : await supabaseAdmin.from("channels").insert(payload).select().single();

  if (upsertError) return res.status(500).json({ error: upsertError.message });

  return res.status(existing ? 200 : 201).json(channel);
});

router.delete("/:id", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const { data: channel, error: findError } = await supabaseAdmin
    .from("channels")
    .select("id, tenant_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (findError) return res.status(500).json({ error: findError.message });
  if (!channel || channel.tenant_id !== req.membership.tenant_id) {
    return res.status(404).json({ error: "Canal no encontrado." });
  }

  // No se borra la fila: conversations/messages ya emitidos referencian este
  // canal, y borrar en cascada perdería ese historial. Desconectar solo
  // detiene el envío/recepción de mensajes nuevos.
  const { error: updateError } = await supabaseAdmin.from("channels").update({ status: "desconectado" }).eq("id", channel.id);

  if (updateError) return res.status(500).json({ error: updateError.message });
  return res.status(204).send();
});

module.exports = router;
