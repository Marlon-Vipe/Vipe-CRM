const { Resend } = require("resend");

const ROLE_LABELS = { owner: "dueño", admin: "administrador", agent: "agente" };

// Mientras no se verifique un dominio propio en Resend, RESEND_FROM_EMAIL
// puede quedarse en el remitente de pruebas de Resend (onboarding@resend.dev),
// que solo entrega a la cuenta dueña de la API key. Ver docs/CRM_PROMPT.md.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let resendClient = null;
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

// Devuelve { sent: boolean } en vez de lanzar cuando no hay API key
// configurada, para que crear la invitación no falle en desarrollo antes de
// tener una cuenta de Resend — el enlace sigue disponible vía "Copiar enlace"
// en la pantalla Equipo como respaldo.
async function sendInvitationEmail({ to, tenantName, role, token }) {
  const client = getResendClient();
  if (!client) {
    // eslint-disable-next-line no-console
    console.warn(`RESEND_API_KEY no configurada — no se envió el email de invitación a ${to}.`);
    return { sent: false };
  }

  const link = `${FRONTEND_URL}/auth/sign-up?invite=${token}`;
  const roleLabel = ROLE_LABELS[role] || role;

  const { error } = await client.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Te invitaron a unirte a ${tenantName} en el CRM Inmobiliario`,
    html: `
      <p>Hola,</p>
      <p><strong>${tenantName}</strong> te invitó a unirte a su equipo en el CRM Inmobiliario como <strong>${roleLabel}</strong>.</p>
      <p><a href="${link}">Aceptar invitación</a></p>
      <p>Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.</p>
    `,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error al enviar el email de invitación:", error.message || error);
    return { sent: false };
  }

  return { sent: true };
}

module.exports = { sendInvitationEmail };
