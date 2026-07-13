const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");
const { requireOwnerOrAdmin } = require("../lib/membership");
const { upsertProfile } = require("../lib/profiles");
const { sendInvitationEmail } = require("../lib/email");

const router = express.Router();

const VALID_ROLES = ["admin", "agent"];

// RF-02: crea la invitación (antes se insertaba directo desde el frontend
// contra Supabase, lo que dejaba el envío del email fuera del flujo). El
// tenant_id se deriva siempre de la membership del que llama, nunca del
// body, para que un owner/admin no pueda invitar a nombre de otro tenant.
router.post("/", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const role = req.body?.role || "agent";

  if (!email) {
    return res.status(400).json({ error: "El correo electrónico es requerido." });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Rol inválido." });
  }

  const { tenant_id: tenantId } = req.membership;

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .single();

  if (tenantError) {
    return res.status(500).json({ error: tenantError.message });
  }

  const { data: invitation, error: insertError } = await supabaseAdmin
    .from("invitations")
    .insert({ tenant_id: tenantId, email, role, invited_by: req.user.id })
    .select("id, email, role, token, expires_at")
    .single();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  const { sent } = await sendInvitationEmail({
    to: invitation.email,
    tenantName: tenant.name,
    role: invitation.role,
    token: invitation.token,
  });

  return res.status(201).json({ ...invitation, email_sent: sent });
});

async function findValidInvitation(token) {
  const { data: invitation, error } = await supabaseAdmin
    .from("invitations")
    .select("id, tenant_id, email, role, expires_at, accepted_at, tenants ( name )")
    .eq("token", token)
    .maybeSingle();

  if (error || !invitation) return { invitation: null, error };
  if (invitation.accepted_at) return { invitation: null, expired: "accepted" };
  if (new Date(invitation.expires_at) < new Date()) return { invitation: null, expired: "expired" };

  return { invitation };
}

// RF-02: previsualización pública del token antes de registrarse — un
// usuario sin sesión todavía no tiene current_tenant_id(), así que RLS
// bloquearía esto desde el frontend; pasa por el backend con service_role.
router.get("/:token", async (req, res) => {
  const { invitation, expired } = await findValidInvitation(req.params.token);

  if (!invitation) {
    const message = expired === "accepted" ? "Esta invitación ya fue utilizada." : "Esta invitación no existe o ya expiró.";
    return res.status(410).json({ error: message });
  }

  return res.json({
    email: invitation.email,
    role: invitation.role,
    tenant_name: invitation.tenants?.name || "",
  });
});

// RF-02: se llama justo después de que Supabase Auth confirma el registro
// del invitado, para unirlo al tenant existente (no crea uno nuevo, a
// diferencia de /auth/complete-signup).
router.post("/:token/accept", requireAuth, async (req, res) => {
  const { invitation, expired } = await findValidInvitation(req.params.token);

  if (!invitation) {
    const message = expired === "accepted" ? "Esta invitación ya fue utilizada." : "Esta invitación no existe o ya expiró.";
    return res.status(410).json({ error: message });
  }

  if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: "Esta invitación fue enviada a otro correo." });
  }

  const { data: existingMembership, error: membershipError } = await supabaseAdmin
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (membershipError) {
    return res.status(500).json({ error: membershipError.message });
  }

  if (existingMembership) {
    if (existingMembership.tenant_id === invitation.tenant_id) {
      return res.json({ tenant_id: existingMembership.tenant_id });
    }
    return res.status(409).json({ error: "Ya perteneces a otra agencia con esta cuenta." });
  }

  const { error: insertError } = await supabaseAdmin.from("memberships").insert({
    tenant_id: invitation.tenant_id,
    user_id: req.user.id,
    role: invitation.role,
  });

  if (insertError) {
    // 23505 = unique_violation: otra request concurrente ya insertó la
    // membership de este usuario (ver constraint memberships_user_id_unique).
    if (insertError.code === "23505") {
      const { data: winningMembership } = await supabaseAdmin.from("memberships").select("tenant_id").eq("user_id", req.user.id).maybeSingle();
      if (winningMembership) return res.json({ tenant_id: winningMembership.tenant_id });
    }
    return res.status(500).json({ error: insertError.message });
  }

  await upsertProfile(req.user, invitation.tenant_id);
  await supabaseAdmin.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id);

  return res.status(201).json({ tenant_id: invitation.tenant_id });
});

module.exports = router;
