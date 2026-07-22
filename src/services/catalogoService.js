const repo = require('../repositories/catalogoRepository');
const organizacionRepository = require('../repositories/organizacionRepository');
const Cargo = require('../models/Cargo');
const { Departamento, Provincia, Distrito } = require('../models/Ubicacion');

const errorReferencia = (err) => err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED';

function crearCrudService({ listar, crear, actualizar, eliminar, validar, mensajeDuplicado, mensajeEnUso }) {
  return {
    async listar() { return listar(); },
    async crear(datos) {
      const errorValidacion = validar(datos);
      if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };
      try {
        const id = await crear(datos);
        return { id };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: mensajeDuplicado } };
        throw err;
      }
    },
    async actualizar(id, datos) {
      const errorValidacion = validar(datos);
      if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };
      try {
        await actualizar(id, datos);
        return {};
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return { error: { status: 409, mensaje: mensajeDuplicado } };
        throw err;
      }
    },
    async eliminar(id) {
      try {
        const filas = await eliminar(id);
        if (filas === 0) return { error: { status: 404, mensaje: 'No encontrado.' } };
        return {};
      } catch (err) {
        if (errorReferencia(err)) return { error: { status: 409, mensaje: mensajeEnUso } };
        throw err;
      }
    },
  };
}

const cargoService = crearCrudService({
  listar: repo.listarCargos, crear: repo.crearCargo, actualizar: repo.actualizarCargo, eliminar: repo.eliminarCargo,
  validar: Cargo.validar,
  mensajeDuplicado: 'Ya existe un cargo con ese nombre.',
  mensajeEnUso: 'No se puede eliminar: este cargo está en uso (personas, candidatos o votaciones).',
});

const departamentoService = crearCrudService({
  listar: repo.listarDepartamentos, crear: repo.crearDepartamento, actualizar: repo.actualizarDepartamento, eliminar: repo.eliminarDepartamento,
  validar: Departamento.validar,
  mensajeDuplicado: 'Ya existe un departamento con ese nombre.',
  mensajeEnUso: 'No se puede eliminar: tiene provincias registradas dentro de él.',
});

const provinciaService = crearCrudService({
  listar: repo.listarProvincias, crear: repo.crearProvincia, actualizar: repo.actualizarProvincia, eliminar: repo.eliminarProvincia,
  validar: Provincia.validar,
  mensajeDuplicado: 'Ya existe una provincia con ese nombre en ese departamento.',
  mensajeEnUso: 'No se puede eliminar: tiene distritos registrados dentro de ella.',
});

const distritoService = crearCrudService({
  listar: repo.listarDistritos, crear: repo.crearDistrito, actualizar: repo.actualizarDistrito, eliminar: repo.eliminarDistrito,
  validar: Distrito.validar,
  mensajeDuplicado: 'Ya existe un distrito con ese nombre en esa provincia.',
  mensajeEnUso: 'No se puede eliminar: hay personas o votaciones asociadas a este distrito.',
});

async function getCatalogos() {
  const [organizaciones, distritos, cargos, departamentos, provincias] = await Promise.all([
    organizacionRepository.listarBasico(),
    repo.listarDistritosBasico(),
    repo.listarCargosBasico(),
    repo.listarDepartamentosBasico(),
    repo.listarProvinciasBasico(),
  ]);
  return { organizaciones, distritos, cargos, departamentos, provincias };
}

module.exports = { cargoService, departamentoService, provinciaService, distritoService, getCatalogos };
