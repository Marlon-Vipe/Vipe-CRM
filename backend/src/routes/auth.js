const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// RF-01: se llama justo después de que Supabase Auth confirma el registro,
// solo en el flujo de "crear agencia nueva" (no para invitaciones, RF-02).
// Idempotente: si el usuario ya tiene membership, no crea un tenant duplicado.
router.post("/complete-signup", requireAuth, async (req, res) => {
  const { tenant_name: tenantName } = req.body;

  if (!tenantName || !tenantName.trim()) {
    return res.status(400).json({ error: "tenant_name es requerido." });
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
    return res.json({ tenant_id: existingMembership.tenant_id });
  }

  const { data: tenantId, error: rpcError } = await supabaseAdmin.rpc("create_tenant_with_owner", {
    p_tenant_name: tenantName.trim(),
    p_user_id: req.user.id,
  });

  if (rpcError) {
    // 23505 = unique_violation: otra request concurrente ya creó el tenant de
    // este usuario (ver constraint memberships_user_id_unique). No es un
    // error real, solo devolvemos el tenant que ganó la carrera.
    if (rpcError.code === "23505") {
      const { data: winningMembership, error: refetchError } = await supabaseAdmin
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (refetchError || !winningMembership) {
        return res.status(500).json({ error: refetchError?.message || "No se pudo resolver el tenant." });
      }
      return res.json({ tenant_id: winningMembership.tenant_id });
    }
    return res.status(500).json({ error: rpcError.message });
  }

  return res.status(201).json({ tenant_id: tenantId });
});

module.exports = router;
