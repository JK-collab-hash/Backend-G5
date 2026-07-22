const db = require('../config/database');

async function findByCredentials(dni, contraseña) {
  const [rows] = await db.query(
    `SELECT u.DNI, u.nombre, u.rol, c.cargoId, c.nombre AS cargo,
            d.distritoId, d.nombre AS distrito,
            EXISTS(SELECT 1 FROM Candidato ca WHERE ca.dni = u.DNI) AS esCandidato
     FROM Usuario u
     LEFT JOIN Cargo c ON u.cargoId = c.cargoId
     LEFT JOIN Distrito d ON u.distritoId = d.distritoId
     WHERE u.DNI = ? AND u.contraseña = ?`,
    [dni, contraseña]
  );
  return rows[0] || null;
}

async function findByDNI(dni) {
  const [rows] = await db.query('SELECT DNI, nombre, apellidoP, apellidoM FROM Usuario WHERE DNI = ?', [dni]);
  return rows[0] || null;
}

async function existsByDNI(dni) {
  const [rows] = await db.query('SELECT DNI FROM Usuario WHERE DNI = ?', [dni]);
  return rows.length > 0;
}

async function listarPorRol(rol) {
  const excluirCandidatos = rol === 'usuario'
    ? "AND NOT EXISTS (SELECT 1 FROM Candidato ca WHERE ca.dni = u.DNI)"
    : '';
  const [rows] = await db.query(
    `SELECT u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.rol, c.nombre AS cargo, d.nombre AS distrito,
      GROUP_CONCAT(CONCAT(o.nombre, ' (', om.rolInterno, ')') SEPARATOR ', ') AS organizaciones
     FROM Usuario u LEFT JOIN Cargo c ON u.cargoId = c.cargoId LEFT JOIN Distrito d ON u.distritoId = d.distritoId LEFT JOIN OrganizacionMiembro om ON om.dni = u.DNI
     LEFT JOIN Organizacion o ON o.organizacionId = om.organizacionId
     WHERE u.rol = ? ${excluirCandidatos}
     GROUP BY u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.rol, c.nombre, d.nombre
     ORDER BY u.DNI`,
    [rol]
  );
  return rows;
}

async function crear({ DNI, nombre, apellidoP, apellidoM, rol, contraseña, cargoId, distritoId }) {
  await db.query(
    `INSERT INTO Usuario (DNI, nombre, apellidoP, apellidoM, rol, contraseña, cargoId, distritoId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [DNI, nombre, apellidoP, apellidoM, rol, contraseña, cargoId || null, distritoId]
  );
}

async function actualizarCuenta(dniActual, { DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId }) {
  const campos = ['DNI = ?', 'nombre = ?', 'apellidoP = ?', 'apellidoM = ?', 'cargoId = ?', 'distritoId = ?'];
  const params = [DNI, nombre, apellidoP, apellidoM, cargoId || null, distritoId];
  if (contraseña) {
    campos.push('contraseña = ?');
    params.push(contraseña);
  }
  params.push(dniActual);
  const [result] = await db.query(`UPDATE Usuario SET ${campos.join(', ')} WHERE DNI = ?`, params);
  return result.affectedRows;
}

async function asignarCargo(dni, cargoId) {
  await db.query('UPDATE Usuario SET cargoId = ? WHERE DNI = ?', [cargoId, dni]);
}

async function crearSolicitudCambioContraseña(dni, contraseñaNueva) {
  const [result] = await db.query(
    `INSERT INTO SolicitudCambioContraseña (dni, contraseñaNueva, estado) VALUES (?, ?, 'pendiente')`,
    [dni, contraseñaNueva]
  );
  return result.insertId;
}

async function listarSolicitudesPendientes() {
  const [rows] = await db.query(
    `SELECT s.solicitudId, s.dni, s.estado, s.fechaSolicitud,
            u.nombre, u.apellidoP, u.apellidoM
     FROM SolicitudCambioContraseña s
     JOIN Usuario u ON u.DNI = s.dni
     WHERE s.estado = 'pendiente'
     ORDER BY s.fechaSolicitud`
  );
  return rows;
}

async function findSolicitudCambioContraseñaById(id) {
  const [rows] = await db.query('SELECT * FROM SolicitudCambioContraseña WHERE solicitudId = ?', [id]);
  return rows[0] || null;
}

async function listarSolicitudesHistorial(limite = 50) {
  const [rows] = await db.query(
    `SELECT s.solicitudId, s.dni, s.estado, s.fechaSolicitud, s.fechaResolucion,
            u.nombre, u.apellidoP, u.apellidoM
     FROM SolicitudCambioContraseña s
     JOIN Usuario u ON u.DNI = s.dni
     WHERE s.estado <> 'pendiente'
     ORDER BY s.fechaResolucion DESC
     LIMIT ?`,
    [limite]
  );
  return rows;
}

async function resolverSolicitudCambioContraseña(id, estado) {
  const [result] = await db.query(
    `UPDATE SolicitudCambioContraseña SET estado = ?, fechaResolucion = NOW()
     WHERE solicitudId = ? AND estado = 'pendiente'`,
    [estado, id]
  );
  return result.affectedRows;
}

async function actualizarContraseña(dni, contraseña) {
  const [result] = await db.query('UPDATE Usuario SET contraseña = ? WHERE DNI = ?', [contraseña, dni]);
  return result.affectedRows;
}

module.exports = {
  findByCredentials, findByDNI, existsByDNI, listarPorRol,
  crear, actualizarCuenta, asignarCargo,
  crearSolicitudCambioContraseña, listarSolicitudesPendientes, listarSolicitudesHistorial,
  findSolicitudCambioContraseñaById, resolverSolicitudCambioContraseña, actualizarContraseña,
};
