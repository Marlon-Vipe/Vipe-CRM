const { supabaseAdmin } = require("./supabaseAdmin");

// No se le hace throw al llamador si esto falla — una notificación perdida
// no debería tumbar el flujo real (guardar el mensaje, aceptar la
// invitación, etc.), solo se loguea.
async function createNotification({ tenantId, type, title, body, metadata, link }) {
  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({ tenant_id: tenantId, type, title, body: body || null, metadata: metadata || {}, link: link || null });
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`Error al crear notificación (${type}):`, error.message);
  }
}

module.exports = { createNotification };
