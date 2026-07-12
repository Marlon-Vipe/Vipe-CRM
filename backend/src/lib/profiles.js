const { supabaseAdmin } = require("./supabaseAdmin");

// Se llama en los dos puntos donde se crea una membership (signup de agencia
// nueva y aceptación de invitación) para que el usuario aparezca en la
// pantalla "Equipo" — auth.users no está expuesto vía PostgREST, así que sin
// esto no hay forma de mostrar su nombre/email en el frontend.
async function upsertProfile(user, tenantId) {
  const { error } = await supabaseAdmin.from("profiles").upsert({
    id: user.id,
    tenant_id: tenantId,
    full_name: user.user_metadata?.full_name || null,
    email: user.email,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error al guardar el perfil:", error.message);
  }
}

module.exports = { upsertProfile };
