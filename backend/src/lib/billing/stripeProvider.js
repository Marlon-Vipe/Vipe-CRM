const Stripe = require("stripe");

const PLAN_PRICE_ENV = { starter: "STRIPE_PRICE_STARTER", pro: "STRIPE_PRICE_PRO" };

let stripeClient = null;
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function isConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function createCheckoutSession({ tenant, plan, successUrl, cancelUrl }) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY).");

  const priceId = process.env[PLAN_PRICE_ENV[plan]];
  if (!priceId) throw new Error(`No hay un Price de Stripe configurado para el plan "${plan}" (${PLAN_PRICE_ENV[plan]}).`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: tenant.id,
    customer: tenant.stripe_customer_id || undefined,
    customer_email: tenant.stripe_customer_id ? undefined : tenant.ownerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenant_id: tenant.id, plan },
    subscription_data: { metadata: { tenant_id: tenant.id, plan } },
  });

  return { url: session.url };
}

async function createPortalSession({ tenant, returnUrl }) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY).");
  if (!tenant.stripe_customer_id) throw new Error("Esta agencia todavía no tiene un cliente de Stripe asociado.");

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// Normaliza los eventos de Stripe a una forma agnóstica de proveedor, para
// que el route handler (webhooksBilling.js) no conozca el shape específico
// de Stripe — así el día que se agregue Paddle/Lemon Squeezy/Azul, solo hace
// falta un nuevo archivo que devuelva esta misma forma normalizada.
function verifyAndParseWebhookEvent({ rawBody, signature }) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe no está configurado.");
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Falta STRIPE_WEBHOOK_SECRET.");

  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

  const STATUS_MAP = {
    trialing: "trial",
    active: "activa",
    past_due: "vencida",
    unpaid: "vencida",
    canceled: "cancelada",
    incomplete_expired: "cancelada",
  };

  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object;
    return {
      tenantId: subscription.metadata?.tenant_id || null,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      status: STATUS_MAP[subscription.status] || "vencida",
      plan: subscription.metadata?.plan || null,
      renewsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    return {
      tenantId: session.client_reference_id || session.metadata?.tenant_id || null,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      status: "activa",
      plan: session.metadata?.plan || null,
      renewsAt: null,
    };
  }

  return null;
}

module.exports = { isConfigured, createCheckoutSession, createPortalSession, verifyAndParseWebhookEvent };
