const db = require('../config/database');
async function listarCargos() {
  const [rows] = await db.query(
    `SELECT c.cargoId, c.nombre, c.tipo,
            (SELECT COUNT(*) FROM Usuario u WHERE u.cargoId = c.cargoId) AS enUsoPersonas,
            (SELECT COUNT(*) FROM Votacion v WHERE v.cargoId = c.cargoId) AS enUsoVotaciones
     FROM Cargo c ORDER BY c.nombre`
  );
  return rows;
}
async function listarCargosBasico() {
  const [rows] = await db.query('SELECT cargoId, nombre, tipo FROM Cargo ORDER BY nombre');
  return rows;
}
async function crearCargo({ nombre, tipo }) {
  const [result] = await db.query('INSERT INTO Cargo (nombre, tipo) VALUES (?, ?)', [nombre, tipo || 'nacional']);
  return result.insertId;
}
async function actualizarCargo(id, { nombre, tipo }) {
  await db.query('UPDATE Cargo SET nombre = ?, tipo = ? WHERE cargoId = ?', [nombre, tipo || 'nacional', id]);
}
async function eliminarCargo(id) {
  const [result] = await db.query('DELETE FROM Cargo WHERE cargoId = ?', [id]);
  return result.affectedRows;
}

async function listarDepartamentos() {
  const [rows] = await db.query(
    `SELECT dep.departamentoId, dep.nombre, (SELECT COUNT(*) FROM Provincia p WHERE p.departamentoId = dep.departamentoId) AS totalProvincias
     FROM Departamento dep ORDER BY dep.nombre`
  );
  return rows;
}
async function listarDepartamentosBasico() {
  const [rows] = await db.query('SELECT departamentoId, nombre FROM Departamento ORDER BY nombre');
  return rows;
}
async function crearDepartamento({ nombre }) {
  const [result] = await db.query('INSERT INTO Departamento (nombre) VALUES (?)', [nombre]);
  return result.insertId;
}
async function actualizarDepartamento(id, { nombre }) {
  await db.query('UPDATE Departamento SET nombre = ? WHERE departamentoId = ?', [nombre, id]);
}
async function eliminarDepartamento(id) {
  const [result] = await db.query('DELETE FROM Departamento WHERE departamentoId = ?', [id]);
  return result.affectedRows;
}

async function listarProvincias() {
  const [rows] = await db.query(
    `SELECT p.provinciaId, p.nombre, p.departamentoId, dep.nombre AS departamento, (SELECT COUNT(*) FROM Distrito d WHERE d.provinciaId = p.provinciaId) AS totalDistritos
     FROM Provincia p JOIN Departamento dep ON p.departamentoId = dep.departamentoId
     ORDER BY dep.nombre, p.nombre`
  );
  return rows;
}
async function listarProvinciasBasico() {
  const [rows] = await db.query('SELECT provinciaId, nombre, departamentoId FROM Provincia ORDER BY nombre');
  return rows;
}
async function crearProvincia({ nombre, departamentoId }) {
  const [result] = await db.query('INSERT INTO Provincia (nombre, departamentoId) VALUES (?, ?)', [nombre, departamentoId]);
  return result.insertId;
}
async function actualizarProvincia(id, { nombre, departamentoId }) {
  await db.query('UPDATE Provincia SET nombre = ?, departamentoId = ? WHERE provinciaId = ?', [nombre, departamentoId, id]);
}
async function eliminarProvincia(id) {
  const [result] = await db.query('DELETE FROM Provincia WHERE provinciaId = ?', [id]);
  return result.affectedRows;
}

async function listarDistritos() {
  const [rows] = await db.query(
    `SELECT d.distritoId, d.nombre, d.provinciaId, p.nombre AS provincia, dep.nombre AS departamento, (SELECT COUNT(*) FROM Usuario u WHERE u.distritoId = d.distritoId) AS enUsoPersonas
     FROM Distrito d JOIN Provincia p ON d.provinciaId = p.provinciaId
     JOIN Departamento dep ON p.departamentoId = dep.departamentoId
     ORDER BY dep.nombre, p.nombre, d.nombre`
  );
  return rows;
}
async function listarDistritosBasico() {
  const [rows] = await db.query('SELECT distritoId, nombre, provinciaId FROM Distrito ORDER BY nombre');
  return rows;
}
async function crearDistrito({ nombre, provinciaId }) {
  const [result] = await db.query('INSERT INTO Distrito (nombre, provinciaId) VALUES (?, ?)', [nombre, provinciaId]);
  return result.insertId;
}
async function actualizarDistrito(id, { nombre, provinciaId }) {
  await db.query('UPDATE Distrito SET nombre = ?, provinciaId = ? WHERE distritoId = ?', [nombre, provinciaId, id]);
}
async function eliminarDistrito(id) {
  const [result] = await db.query('DELETE FROM Distrito WHERE distritoId = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  listarCargos, listarCargosBasico, crearCargo, actualizarCargo, eliminarCargo,
  listarDepartamentos, listarDepartamentosBasico, crearDepartamento, actualizarDepartamento, eliminarDepartamento,
  listarProvincias, listarProvinciasBasico, crearProvincia, actualizarProvincia, eliminarProvincia,
  listarDistritos, listarDistritosBasico, crearDistrito, actualizarDistrito, eliminarDistrito,
};
