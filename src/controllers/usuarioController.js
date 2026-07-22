const usuarioService = require('../services/usuarioService');

async function listarUsuarios(req, res) {
  try {
    return res.json(await usuarioService.listarUsuarios());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearUsuario(req, res) {
  try {
    const { error } = await usuarioService.crearCuenta('usuario', req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listarAdmins(req, res) {
  try {
    return res.json(await usuarioService.listarAdmins());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearAdmin(req, res) {
  try {
    const { error } = await usuarioService.crearCuenta('admin', req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarCuenta(req, res) {
  try {
    const { error } = await usuarioService.actualizarCuenta(req.params.dni, req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listarSolicitudesContraseña(req, res) {
  try {
    return res.json(await usuarioService.listarSolicitudesCambioContraseña());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listarHistorialContraseña(req, res) {
  try {
    return res.json(await usuarioService.listarHistorialCambioContraseña());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function aprobarSolicitudContraseña(req, res) {
  try {
    const { error } = await usuarioService.aprobarSolicitudCambioContraseña(req.params.id);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function rechazarSolicitudContraseña(req, res) {
  try {
    const { error } = await usuarioService.rechazarSolicitudCambioContraseña(req.params.id);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listarUsuarios, crearUsuario, listarAdmins, crearAdmin, actualizarCuenta,
  listarSolicitudesContraseña, listarHistorialContraseña,
  aprobarSolicitudContraseña, rechazarSolicitudContraseña,
};
