const usuarioRepository = require('../repositories/usuarioRepository');
const Usuario = require('../models/Usuario');

async function login(dni, contraseña) {
  if (!dni || !contraseña) {
    return { error: { status: 400, mensaje: 'DNI y contraseña son requeridos.' } };
  }
  const usuario = await usuarioRepository.findByCredentials(dni, contraseña);
  if (!usuario) {
    return { error: { status: 401, mensaje: 'Credenciales incorrectas.' } };
  }
  usuario.esCandidato = !!usuario.esCandidato;
  return { usuario };
}

async function solicitarCambioContraseña(dni, nombre, contraseñaActual, contraseñaNueva) {
  if (!dni || !nombre || !contraseñaActual || !contraseñaNueva) {
    return { error: { status: 400, mensaje: 'DNI, nombre, contraseña actual y nueva contraseña son requeridos.' } };
  }
  if (!Usuario.esContraseñaValida(contraseñaNueva)) {
    return { error: { status: 400, mensaje: `La nueva contraseña debe tener al menos ${Usuario.MIN_LARGO_CONTRASEÑA} caracteres.` } };
  }
  if (contraseñaNueva === contraseñaActual) {
    return { error: { status: 400, mensaje: 'La nueva contraseña no puede ser igual a la contraseña actual.' } };
  }

  const usuario = await usuarioRepository.findByCredentials(dni, contraseñaActual);
  if (!usuario) {
    return { error: { status: 401, mensaje: 'DNI o contraseña actual incorrectos.' } };
  }
  if (usuario.nombre.trim().toLowerCase() !== nombre.trim().toLowerCase()) {
    return { error: { status: 401, mensaje: 'El nombre no coincide con el DNI indicado.' } };
  }

  await usuarioRepository.crearSolicitudCambioContraseña(dni, contraseñaNueva);
  return { mensaje: 'Solicitud enviada. Un administrador debe aprobarla para que el cambio se haga efectivo.' };
}

module.exports = { login, solicitarCambioContraseña };
