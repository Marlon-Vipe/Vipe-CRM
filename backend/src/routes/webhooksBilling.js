const express = require("express");

const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { getProvider } = require("../lib/billing");

const router = express.Router();

const ACTIVE_STATUSES = ["trial", "activa"];

// El webhook del proveedor de pagos es la única fuente de verdad para
// activar/suspender una agencia — nunca se actualiza `subscriptions`/
// `tenants.status` desde ningún otro lugar del código.
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = getProvider().verifyAndParseWebhookEvent({ rawBody: req.body, signature: req.headers["stripe-signature"] });
  } catch (error) {
    return res.status(400).send(`Firma de webhook inválida: ${error.message}`);
  }

  if (!event || !event.tenantId) {
    return res.status(200).send();
  }

  const tenantStatus = ACTIVE_STATUSES.includes(event.status) ? "activo" : "suspendido";

  const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").upsert(
    {
      tenant_id: event.tenantId,
      plan: event.plan || undefined,
      status: event.status,
      stripe_customer_id: event.stripeCustomerId,
      stripe_subscription_id: event.stripeSubscriptionId,
      renews_at: event.renewsAt,
    },
    { onConflict: "tenant_id" }
  );

  if (subscriptionError) {
    // eslint-disable-next-line no-console
    console.error("Error al actualizar subscriptions desde el webhook de facturación:", subscriptionError.message);
  }

  const tenantUpdate = { status: tenantStatus };
  if (event.plan) tenantUpdate.plan = event.plan;

  const { error: tenantError } = await supabaseAdmin.from("tenants").update(tenantUpdate).eq("id", event.tenantId);

  if (tenantError) {
    // eslint-disable-next-line no-console
    console.error("Error al actualizar tenants.status desde el webhook de facturación:", tenantError.message);
  }

  return res.status(200).send();
});

module.exports = router;
