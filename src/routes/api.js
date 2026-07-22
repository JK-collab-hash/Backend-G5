const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/authController');
const votCtrl = require('../controllers/votacionController');
const usuarioCtrl = require('../controllers/usuarioController');
const candidatoCtrl = require('../controllers/candidatoController');
const organizacionCtrl = require('../controllers/organizacionController');
const catalogoCtrl = require('../controllers/catalogoController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/session', authCtrl.getSession);
router.post('/auth/solicitar-cambio-contrasena', authCtrl.solicitarCambioContraseña);

router.get('/votaciones/disponibles', requireAuth, votCtrl.getVotacionesDisponibles);
router.post('/votaciones/votar', requireAuth, votCtrl.registrarVoto);
router.get('/votaciones/resultados', requireAuth, votCtrl.getResultados);
router.get('/votaciones/registro', requireAdmin, votCtrl.getRegistro);
router.post('/votaciones/crear', requireAdmin, votCtrl.crearVotacion);
router.post('/votaciones/toggle/:id', requireAdmin, votCtrl.toggleVotacion);
router.post('/votaciones/cerrar/:id', requireAdmin, votCtrl.cerrarVotacion);

router.get('/usuarios', requireAdmin, usuarioCtrl.listarUsuarios);
router.post('/usuarios', requireAdmin, usuarioCtrl.crearUsuario);
router.get('/usuarios/:dni/organizaciones', requireAuth, organizacionCtrl.listarOrganizacionesDeUsuario);
router.get('/admins', requireAdmin, usuarioCtrl.listarAdmins);
router.post('/admins', requireAdmin, usuarioCtrl.crearAdmin);
router.put('/cuentas/:dni', requireAdmin, usuarioCtrl.actualizarCuenta);

router.get('/solicitudes-contrasena', requireAdmin, usuarioCtrl.listarSolicitudesContraseña);
router.get('/solicitudes-contrasena/historial', requireAdmin, usuarioCtrl.listarHistorialContraseña);
router.post('/solicitudes-contrasena/:id/aprobar', requireAdmin, usuarioCtrl.aprobarSolicitudContraseña);
router.post('/solicitudes-contrasena/:id/rechazar', requireAdmin, usuarioCtrl.rechazarSolicitudContraseña);

router.get('/candidatos', candidatoCtrl.listarCandidatos);
router.post('/candidatos', requireAdmin, candidatoCtrl.crearCandidato);
router.put('/candidatos/:candidatoId', requireAdmin, candidatoCtrl.actualizarCandidato);
router.delete('/candidatos/:candidatoId', requireAdmin, candidatoCtrl.finalizarCandidatura);

router.get('/organizaciones', requireAdmin, organizacionCtrl.listarOrganizacionesCatalogo);
router.post('/organizaciones', requireAdmin, organizacionCtrl.crearOrganizacion);
router.put('/organizaciones/:id', requireAdmin, organizacionCtrl.actualizarOrganizacion);
router.delete('/organizaciones/:id', requireAdmin, organizacionCtrl.eliminarOrganizacion);
router.post('/organizacion-miembros', requireAdmin, organizacionCtrl.agregarMiembroOrganizacion);
router.delete('/organizacion-miembros/:dni/:organizacionId', requireAdmin, organizacionCtrl.quitarMiembroOrganizacion);

router.get('/cargos', requireAdmin, catalogoCtrl.listarCargos);
router.post('/cargos', requireAdmin, catalogoCtrl.crearCargo);
router.put('/cargos/:id', requireAdmin, catalogoCtrl.actualizarCargo);
router.delete('/cargos/:id', requireAdmin, catalogoCtrl.eliminarCargo);

router.get('/departamentos', requireAdmin, catalogoCtrl.listarDepartamentos);
router.post('/departamentos', requireAdmin, catalogoCtrl.crearDepartamento);
router.put('/departamentos/:id', requireAdmin, catalogoCtrl.actualizarDepartamento);
router.delete('/departamentos/:id', requireAdmin, catalogoCtrl.eliminarDepartamento);

router.get('/provincias', requireAdmin, catalogoCtrl.listarProvincias);
router.post('/provincias', requireAdmin, catalogoCtrl.crearProvincia);
router.put('/provincias/:id', requireAdmin, catalogoCtrl.actualizarProvincia);
router.delete('/provincias/:id', requireAdmin, catalogoCtrl.eliminarProvincia);

router.get('/distritos', requireAdmin, catalogoCtrl.listarDistritos);
router.post('/distritos', requireAdmin, catalogoCtrl.crearDistrito);
router.put('/distritos/:id', requireAdmin, catalogoCtrl.actualizarDistrito);
router.delete('/distritos/:id', requireAdmin, catalogoCtrl.eliminarDistrito);

router.get('/catalogos', catalogoCtrl.getCatalogos);

module.exports = router;
