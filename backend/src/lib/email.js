const { supabaseAdmin } = require("./supabaseAdmin");

// Envío de invitaciones vía el propio servicio de correo de Supabase Auth
// (gratis, sin proveedor externo) en vez de Resend. `inviteUserByEmail` crea
// (o reutiliza) el usuario en auth.users y dispara el template "Invite user"
// configurado en el dashboard de Supabase — no hay forma de mandar HTML
// arbitrario por este medio, solo se le puede pasar `data` para que el
// template lo interpole (ver Authentication → Email Templates → Invite user
// en el dashboard de Supabase para personalizar el texto).
//
// El link que Supabase manda por correo apunta a `redirectTo` con su propio
// magic-link (#access_token=...) pegado atrás. Para no interferir con nuestro
// flujo de invitación propio (tabla `invitations`, token, /auth/sign-up), el
// redirectTo apunta a /auth/invite-callback?invite=<nuestro token>, una
// pantalla puente que cierra esa sesión auto-creada por Supabase y redirige
// al signup normal con nuestro token — el signup en sí no cambia en nada.
//
// Importante: el envío de correo integrado de Supabase (sin SMTP propio
// configurado) está pensado solo para desarrollo/pruebas — Supabase limita
// esto a unos pocos correos por hora por proyecto. Si el volumen de
// invitaciones crece, hay que configurar SMTP propio en el dashboard de
// Supabase (Authentication → Settings → SMTP Settings) o volver a un
// proveedor dedicado.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function sendInvitationEmail({ to, tenantName, role, token }) {
  const redirectTo = `${FRONTEND_URL}/auth/invite-callback?invite=${token}`;

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(to, {
    redirectTo,
    data: { tenant_name: tenantName, role },
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error al enviar el email de invitación (Supabase Auth):", error.message || error);
    return { sent: false };
  }

  return { sent: true };
}

module.exports = { sendInvitationEmail };
