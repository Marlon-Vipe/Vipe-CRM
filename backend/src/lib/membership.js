const { supabaseAdmin } = require("./supabaseAdmin");

// El backend usa service_role (no sujeto a RLS), así que cualquier endpoint
// que necesite saber a qué tenant pertenece el usuario autenticado, o si
// tiene permiso de owner/admin, debe resolverlo explícitamente aquí en vez
// de confiar en RLS (ver sección 3 del prompt).
async function getMembership(userId) {
  const { data, error } = await supabaseAdmin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Middleware: exige que el usuario autenticado pertenezca a un tenant con
// rol owner/admin, y deja la membership resuelta en req.membership.
async function requireOwnerOrAdmin(req, res, next) {
  try {
    const membership = await getMembership(req.user.id);
    if (!membership) {
      return res.status(403).json({ error: "No perteneces a ninguna agencia." });
    }
    if (!["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ error: "Solo el dueño o un administrador de la agencia puede hacer esto." });
    }
    req.membership = membership;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Middleware: exige que el usuario autenticado pertenezca a algún tenant
// (cualquier rol), y deja la membership resuelta en req.membership.
async function requireMembership(req, res, next) {
  try {
    const membership = await getMembership(req.user.id);
    if (!membership) {
      return res.status(403).json({ error: "No perteneces a ninguna agencia." });
    }
    req.membership = membership;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getMembership, requireOwnerOrAdmin, requireMembership };
