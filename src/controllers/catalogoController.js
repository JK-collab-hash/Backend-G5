const { cargoService, departamentoService, provinciaService, distritoService, getCatalogos } = require('../services/catalogoService');

function controladorPara(service, idParam) {
  return {
    async listar(req, res) {
      try { return res.json(await service.listar()); }
      catch (err) { return res.status(500).json({ error: err.message }); }
    },
    async crear(req, res) {
      try {
        const { error, id } = await service.crear(req.body);
        if (error) return res.status(error.status).json({ error: error.mensaje });
        return res.status(201).json({ ok: true, [idParam]: id });
      } catch (err) { return res.status(500).json({ error: err.message }); }
    },
    async actualizar(req, res) {
      try {
        const { error } = await service.actualizar(req.params.id, req.body);
        if (error) return res.status(error.status).json({ error: error.mensaje });
        return res.json({ ok: true });
      } catch (err) { return res.status(500).json({ error: err.message }); }
    },
    async eliminar(req, res) {
      try {
        const { error } = await service.eliminar(req.params.id);
        if (error) return res.status(error.status).json({ error: error.mensaje });
        return res.json({ ok: true });
      } catch (err) { return res.status(500).json({ error: err.message }); }
    },
  };
}

const cargoController = controladorPara(cargoService, 'cargoId');
const departamentoController = controladorPara(departamentoService, 'departamentoId');
const provinciaController = controladorPara(provinciaService, 'provinciaId');
const distritoController = controladorPara(distritoService, 'distritoId');

async function getCatalogosCtrl(req, res) {
  try {
    return res.json(await getCatalogos());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listarCargos: cargoController.listar, crearCargo: cargoController.crear, actualizarCargo: cargoController.actualizar, eliminarCargo: cargoController.eliminar,
  listarDepartamentos: departamentoController.listar, crearDepartamento: departamentoController.crear, actualizarDepartamento: departamentoController.actualizar, eliminarDepartamento: departamentoController.eliminar,
  listarProvincias: provinciaController.listar, crearProvincia: provinciaController.crear, actualizarProvincia: provinciaController.actualizar, eliminarProvincia: provinciaController.eliminar,
  listarDistritos: distritoController.listar, crearDistrito: distritoController.crear, actualizarDistrito: distritoController.actualizar, eliminarDistrito: distritoController.eliminar,
  getCatalogos: getCatalogosCtrl,
};
