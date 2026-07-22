const candidatoService = require('../services/candidatoService');

async function listarCandidatos(req, res) {
  try {
    return res.json(await candidatoService.listarCandidatos(req.query));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearCandidato(req, res) {
  try {
    const { error, candidatoId } = await candidatoService.crearCandidato(req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.status(201).json({ ok: true, candidatoId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarCandidato(req, res) {
  try {
    const { error } = await candidatoService.actualizarCandidato(req.params.candidatoId, req.body);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function finalizarCandidatura(req, res) {
  try {
    const { error } = await candidatoService.finalizarCandidatura(req.params.candidatoId);
    if (error) return res.status(error.status).json({ error: error.mensaje });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listarCandidatos, crearCandidato, actualizarCandidato, finalizarCandidatura };
