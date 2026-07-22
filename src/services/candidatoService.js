const candidatoRepository = require('../repositories/candidatoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const Candidato = require('../models/Candidato');

async function listarCandidatos(filtros) {
  return candidatoRepository.listar(filtros);
}

async function crearCandidato({ dni, cargoId, organizacionId }) {
  const errorValidacion = Candidato.validarCreacion({ dni, cargoId });
  if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };

  if (!(await usuarioRepository.existsByDNI(dni))) {
    return { error: { status: 404, mensaje: 'No existe un usuario con ese DNI. Crea el usuario primero.' } };
  }

  try {
    const candidatoId = await candidatoRepository.crear({ dni, cargoId, organizacionId });
    return { candidatoId };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: 'Esta persona ya postula a ese cargo.' } };
    throw err;
  }
}

async function actualizarCandidato(candidatoId, { cargoId, organizacionId }) {
  const errorValidacion = Candidato.validarActualizacion({ cargoId });
  if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };

  try {
    const filas = await candidatoRepository.actualizar(candidatoId, { cargoId, organizacionId });
    if (filas === 0) return { error: { status: 404, mensaje: 'No existe esa postulación.' } };
    return {};
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: 'Esta persona ya postula a ese cargo.' } };
    throw err;
  }
}

async function finalizarCandidatura(candidatoId) {
  const filas = await candidatoRepository.eliminar(candidatoId);
  if (filas === 0) return { error: { status: 404, mensaje: 'No existe esa postulación.' } };
  return {};
}

module.exports = { listarCandidatos, crearCandidato, actualizarCandidato, finalizarCandidatura };
