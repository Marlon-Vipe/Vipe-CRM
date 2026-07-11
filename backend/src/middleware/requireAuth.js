const { supabaseAdmin } = require("../lib/supabaseAdmin");

// Verifica el JWT de Supabase Auth enviado por el frontend y adjunta el
// usuario autenticado a la request. Nunca confiar en un user_id que venga
// en el body: siempre se deriva del token verificado contra Supabase.
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Falta el header Authorization Bearer <token>." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}

module.exports = { requireAuth };
