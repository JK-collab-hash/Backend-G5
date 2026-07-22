const organizacionService = require('../services/organizacionService');

async function listarOrganizacionesCatalogo(req, res) {
  try {
    return res.json(await organizacionService.listarCatalogo());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearOrganizacion(req, res) {
  try {
    const { error, organizacionId } = await organizacionService.crear(req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true, organizacionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarOrganizacion(req, res) {
  try {
    const { error } = await organizacionService.actualizar(req.params.id, req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarOrganizacion(req, res) {
  try {
    const { error } = await organizacionService.eliminar(req.params.id);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function agregarMiembroOrganizacion(req, res) {
  try {
    const { error } = await organizacionService.agregarMiembro(req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function quitarMiembroOrganizacion(req, res) {
  try {
    const { dni, organizacionId } = req.params;
    const { error } = await organizacionService.quitarMiembro(dni, organizacionId);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listarOrganizacionesDeUsuario(req, res) {
  try {
    const { error, organizaciones } = await organizacionService.listarDeUsuario(req.session.usuario, req.params.dni);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json(organizaciones);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listarOrganizacionesCatalogo, crearOrganizacion, actualizarOrganizacion, eliminarOrganizacion,
  agregarMiembroOrganizacion, quitarMiembroOrganizacion, listarOrganizacionesDeUsuario,
};
