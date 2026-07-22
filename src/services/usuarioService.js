const usuarioRepository = require('../repositories/usuarioRepository');
const Usuario = require('../models/Usuario');

async function listarUsuarios() {
  return usuarioRepository.listarPorRol('usuario');
}

async function listarAdmins() {
  return usuarioRepository.listarPorRol('admin');
}

async function crearCuenta(rol, datos) {
  const errores = Usuario.validar(datos);
  if (errores.length) return { error: { status: 400, mensaje: errores[0] } };
  if (!datos.contraseña) return { error: { status: 400, mensaje: 'La contraseña es obligatoria.' } };
  if (!Usuario.esContraseñaValida(datos.contraseña)) {
    return { error: { status: 400, mensaje: `La contraseña debe tener al menos ${Usuario.MIN_LARGO_CONTRASEÑA} caracteres.` } };
  }

  try {
    await usuarioRepository.crear({ ...datos, rol });
    return {};
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const existente = await usuarioRepository.findByDNI(datos.DNI);
      const detalle = existente ? ` (registrado a nombre de ${existente.nombre} ${existente.apellidoP} ${existente.apellidoM})` : '';
      const tipo = rol === 'admin' ? 'administrador' : 'usuario';
      return { error: { status: 409, mensaje: `Ya existe un ${tipo} con ese DNI${detalle}.` } };
    } throw err;
  }
}

async function actualizarCuenta(dniActual, datos) {
  const errores = Usuario.validar(datos);
  if (errores.length) return { error: { status: 400, mensaje: errores[0] } };
  if (datos.contraseña && !Usuario.esContraseñaValida(datos.contraseña)) {
    return { error: { status: 400, mensaje: `La contraseña debe tener al menos ${Usuario.MIN_LARGO_CONTRASEÑA} caracteres.` } };
  }

  try {
    const filasAfectadas = await usuarioRepository.actualizarCuenta(dniActual, datos);
    if (filasAfectadas === 0) return { error: { status: 404, mensaje: 'No existe una cuenta con ese DNI.' } };
    return {};
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return { error: { status: 409, mensaje: 'Ya existe otra cuenta con ese DNI.' } };
    } throw err;
  }
}

async function listarSolicitudesCambioContraseña() {
  return usuarioRepository.listarSolicitudesPendientes();
}

async function listarHistorialCambioContraseña() {
  return usuarioRepository.listarSolicitudesHistorial();
}

async function aprobarSolicitudCambioContraseña(id) {
  const solicitud = await usuarioRepository.findSolicitudCambioContraseñaById(id);
  if (!solicitud) return { error: { status: 404, mensaje: 'La solicitud no existe.' } };
  if (solicitud.estado !== 'pendiente') return { error: { status: 409, mensaje: 'Esta solicitud ya fue resuelta.' } };

  const filas = await usuarioRepository.resolverSolicitudCambioContraseña(id, 'aprobada');
  if (filas === 0) return { error: { status: 409, mensaje: 'Esta solicitud ya fue resuelta.' } };

  await usuarioRepository.actualizarContraseña(solicitud.dni, solicitud.contraseñaNueva);
  return {};
}

async function rechazarSolicitudCambioContraseña(id) {
  const solicitud = await usuarioRepository.findSolicitudCambioContraseñaById(id);
  if (!solicitud) return { error: { status: 404, mensaje: 'La solicitud no existe.' } };
  if (solicitud.estado !== 'pendiente') return { error: { status: 409, mensaje: 'Esta solicitud ya fue resuelta.' } };

  const filas = await usuarioRepository.resolverSolicitudCambioContraseña(id, 'rechazada');
  if (filas === 0) return { error: { status: 409, mensaje: 'Esta solicitud ya fue resuelta.' } };
  return {};
}

module.exports = {
  listarUsuarios, listarAdmins, crearCuenta, actualizarCuenta,
  listarSolicitudesCambioContraseña, listarHistorialCambioContraseña,
  aprobarSolicitudCambioContraseña, rechazarSolicitudCambioContraseña,
};
