const organizacionRepository = require('../repositories/organizacionRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const Organizacion = require('../models/Organizacion');

const errorReferencia = (err) => err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED';

async function listarCatalogo() {
  return organizacionRepository.listarCatalogo();
}

async function crear({ nombre, tipo }) {
  const errorValidacion = Organizacion.validar({ nombre, tipo });
  if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };
  try {
    const organizacionId = await organizacionRepository.crear({ nombre, tipo });
    return { organizacionId };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: 'Ya existe una organización con ese nombre.' } };
    throw err;
  }
}

async function actualizar(id, { nombre, tipo }) {
  const errorValidacion = Organizacion.validar({ nombre, tipo });
  if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };
  try {
    await organizacionRepository.actualizar(id, { nombre, tipo });
    return {};
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: 'Ya existe una organización con ese nombre.' } };
    throw err;
  }
}

async function eliminar(id) {
  try {
    const filas = await organizacionRepository.eliminar(id);
    if (filas === 0) return { error: { status: 404, mensaje: 'Organización no encontrada.' } };
    return {};
  } catch (err) {
    if (errorReferencia(err)) {
      return { error: { status: 409, mensaje: 'No se puede eliminar: tiene miembros, candidatos o votaciones asociadas. Quita esas relaciones primero.' } };
    }
    throw err;
  }
}

async function agregarMiembro({ dni, organizacionId, rolInterno }) {
  if (!dni || !organizacionId) return { error: { status: 400, mensaje: 'DNI y organización son obligatorios.' } };
  if (!(await usuarioRepository.existsByDNI(dni))) {
    return { error: { status: 404, mensaje: 'No existe un usuario con ese DNI.' } };
  }
  try {
    await organizacionRepository.agregarMiembro({ dni, organizacionId, rolInterno });
    return {};
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: 'Esta persona ya pertenece a esa organización.' } };
    throw err;
  }
}

async function quitarMiembro(dni, organizacionId) {
  const filas = await organizacionRepository.quitarMiembro(dni, organizacionId);
  if (filas === 0) return { error: { status: 404, mensaje: 'Esa persona no pertenece a esa organización.' } };
  return {};
}

async function listarDeUsuario(sesion, dniConsultado) {
  const esElMismo = sesion.DNI === dniConsultado;
  if (!esElMismo && sesion.rol !== 'admin') {
    return { error: { status: 403, mensaje: 'No tienes permiso para ver esta información.' } };
  }
  return { organizaciones: await organizacionRepository.listarDeUsuario(dniConsultado) };
}

module.exports = { listarCatalogo, crear, actualizar, eliminar, agregarMiembro, quitarMiembro, listarDeUsuario };
