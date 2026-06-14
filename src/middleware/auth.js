function requireAdmin(req, res, next) {
  if(req.session.usuario && req.session.usuario.rol === 'admin')
    return next();
  return res.status(401).json({ error: 'No autorizado.' });
}

module.exports = { requireAdmin };