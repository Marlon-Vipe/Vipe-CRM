// Capa de abstracción de facturación: los routes (billing.js,
// webhooksBilling.js) programan contra esta interfaz, nunca contra el SDK
// de un proveedor específico. Hoy solo existe la implementación de Stripe;
// cuando se decida el proveedor real para República Dominicana (Paddle,
// Lemon Squeezy, Cardnet, Azul...), se agrega un archivo nuevo con la misma
// forma y se cambia BILLING_PROVIDER — nada en los routes ni en el frontend
// tiene que cambiar.
const providers = { stripe: require("./stripeProvider") };

function getProvider() {
  const name = process.env.BILLING_PROVIDER || "stripe";
  const provider = providers[name];
  if (!provider) throw new Error(`Proveedor de facturación desconocido: "${name}".`);
  return provider;
}

module.exports = { getProvider };
