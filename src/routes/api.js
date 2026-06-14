const express = require('express');
const router  = express.Router();
const authCtrl = require('../controllers/authController');
const votCtrl = require('../controllers/votacionController'); 
const gestionCtrl = require('../controllers/gestionController');
const { requireAdmin } = require('../middleware/auth');

router.post('/auth/usuario', authCtrl.loginUsuario); 
router.post('/auth/admin', authCtrl.loginAdmin); 
router.post('/auth/logout', authCtrl.logout); 
router.get('/auth/session', authCtrl.getSession); 
router.get('/votaciones/disponibles', votCtrl.getVotacionesDisponibles); 
router.post('/votaciones/votar', votCtrl.registrarVoto); 
router.get('/votaciones/resultados', votCtrl.getResultados); 
router.post('/votaciones/crear', requireAdmin, votCtrl.crearVotacion); 
router.post('/votaciones/toggle/:id', requireAdmin, votCtrl.toggleVotacion);
router.get('/usuarios', requireAdmin, gestionCtrl.listarUsuarios);
router.post('/usuarios', requireAdmin, gestionCtrl.crearUsuario);  
router.post('/admins', requireAdmin, gestionCtrl.crearAdmin);
router.get('/candidatos', gestionCtrl.listarCandidatos);
router.post('/candidatos', requireAdmin, gestionCtrl.crearCandidato);  
router.get('/catalogos', gestionCtrl.getCatalogos); 

module.exports = router;