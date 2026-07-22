const votacionService = require('../services/votacionService');

async function getVotacionesDisponibles(req, res) {
  try {
    const resultado = await votacionService.getVotacionesDisponibles(req.session.usuario);
    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo votaciones.' });
  }
}

async function registrarVoto(req, res) {
  try {
    const { error, mensaje } = await votacionService.registrarVoto(req.session.usuario, req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true, mensaje });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error registrando voto.' });
  }
}

async function getResultados(req, res) {
  try {
    const resultado = await votacionService.getResultados();
    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo resultados.' });
  }
}

async function crearVotacion(req, res) {
  try {
    const { votacionId, error } = await votacionService.crearVotacion(req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true, votacionId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creando votación.' });
  }
}

async function toggleVotacion(req, res) {
  try {
    const { activa, error } = await votacionService.toggleVotacion(req.params.id);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true, activa });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando votación.' });
  }
}

async function cerrarVotacion(req, res) {
  try {
    const { error, ...resultado } = await votacionService.cerrarVotacion(req.params.id);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true, ...resultado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error cerrando votación.' });
  }
}

async function getRegistro(req, res) {
  try {
    const registro = await votacionService.getRegistro();
    return res.json(registro);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo el registro.' });
  }
}

module.exports = { getVotacionesDisponibles, registrarVoto, getResultados, crearVotacion, toggleVotacion, cerrarVotacion, getRegistro };