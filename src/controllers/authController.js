const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { dni, contraseña } = req.body;
    const { usuario, error } = await authService.login(dni, contraseña);
    if (error) return res.status(error.status).json({ error: error.mensaje });

    req.session.usuario = usuario;
    return res.json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}

async function solicitarCambioContraseña(req, res) {
  try {
    const { dni, nombre, contraseñaActual, contraseñaNueva } = req.body;
    const { error, mensaje } = await authService.solicitarCambioContraseña(dni, nombre, contraseñaActual, contraseñaNueva);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true, mensaje });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}

function logout(req, res) {
  req.session.destroy();
  return res.json({ ok: true });
}

function getSession(req, res) {
  if (req.session.usuario) {
    const tipo = req.session.usuario.rol === 'admin' ? 'admin' : 'usuario';
    return res.json({ tipo, data: req.session.usuario });
  }
  return res.json({ tipo: null });
}

module.exports = { login, logout, getSession, solicitarCambioContraseña };
