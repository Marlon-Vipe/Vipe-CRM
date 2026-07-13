const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");
const { requireMembership, requireOwnerOrAdmin } = require("../lib/membership");
const { getProvider } = require("../lib/billing");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// RF-11: plan y estado de pago del tenant. Lee `tenants` (lo que ya muestra
// el frontend) más el detalle de `subscriptions` (fechas, IDs del proveedor)
// cuando existe.
router.get("/subscription", requireAuth, requireMembership, async (req, res) => {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("plan, status")
    .eq("id", req.membership.tenant_id)
    .single();

  if (tenantError) return res.status(500).json({ error: tenantError.message });

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, renews_at")
    .eq("tenant_id", req.membership.tenant_id)
    .maybeSingle();

  if (subscriptionError) return res.status(500).json({ error: subscriptionError.message });

  return res.json({
    plan: subscription?.plan || tenant.plan,
    status: subscription?.status || null,
    tenantStatus: tenant.status,
    renewsAt: subscription?.renews_at || null,
    billingConfigured: getProvider().isConfigured(),
  });
});

router.post("/checkout", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const plan = req.body?.plan;
  if (!plan) return res.status(400).json({ error: "Falta el plan." });

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return res.status(501).json({ error: "La facturación todavía no está configurada para esta agencia. Contacta al equipo de soporte." });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id, name")
    .eq("id", req.membership.tenant_id)
    .single();
  if (tenantError) return res.status(500).json({ error: tenantError.message });

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  try {
    const { url } = await provider.createCheckoutSession({
      tenant: { ...tenant, stripe_customer_id: subscription?.stripe_customer_id, ownerEmail: req.user.email },
      plan,
      successUrl: `${FRONTEND_URL}/perfil?checkout=success`,
      cancelUrl: `${FRONTEND_URL}/perfil?checkout=cancelled`,
    });
    return res.json({ url });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

router.post("/portal", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const provider = getProvider();
  if (!provider.isConfigured()) {
    return res.status(501).json({ error: "La facturación todavía no está configurada para esta agencia. Contacta al equipo de soporte." });
  }

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", req.membership.tenant_id)
    .maybeSingle();
  if (subscriptionError) return res.status(500).json({ error: subscriptionError.message });

  try {
    const { url } = await provider.createPortalSession({
      tenant: { stripe_customer_id: subscription?.stripe_customer_id },
      returnUrl: `${FRONTEND_URL}/perfil`,
    });
    return res.json({ url });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

module.exports = router;
