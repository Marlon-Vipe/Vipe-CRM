const twilio = require("twilio");

let client = null;

function isConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

function getTwilioClient() {
  if (!isConfigured()) return null;
  if (!client) client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client;
}

// Los payloads de Twilio traen los números con el prefijo "whatsapp:"
// (ej. "whatsapp:+18095551234"); el resto del sistema (channels.external_id,
// contacts.phone) los guarda en formato E.164 simple, sin el prefijo.
function stripWhatsAppPrefix(value) {
  return (value || "").replace(/^whatsapp:/, "");
}

function toWhatsAppAddress(phoneE164) {
  return `whatsapp:${phoneE164}`;
}

async function sendWhatsAppMessage({ from, to, body }) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    throw new Error("Twilio no está configurado (faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).");
  }

  return twilioClient.messages.create({
    from: toWhatsAppAddress(from),
    to: toWhatsAppAddress(to),
    body,
  });
}

// RF-16: fuera de la ventana de servicio de 24h, WhatsApp exige mandar una
// plantilla ya aprobada por Meta en vez de texto libre — se envía por
// Content SID (Twilio Content API) + variables posicionales ("1", "2", ...).
async function sendWhatsAppTemplate({ from, to, contentSid, variables }) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    throw new Error("Twilio no está configurado (faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).");
  }

  const contentVariables = {};
  variables.forEach((value, index) => {
    contentVariables[String(index + 1)] = value;
  });

  return twilioClient.messages.create({
    from: toWhatsAppAddress(from),
    to: toWhatsAppAddress(to),
    contentSid,
    contentVariables: JSON.stringify(contentVariables),
  });
}

function validateTwilioSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = req.headers["x-twilio-signature"];
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return twilio.validateRequest(authToken, signature, url, req.body);
}

module.exports = { isConfigured, stripWhatsAppPrefix, sendWhatsAppMessage, sendWhatsAppTemplate, validateTwilioSignature };
