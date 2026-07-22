const db = require('../config/database');

async function listarCatalogo() {
  const [rows] = await db.query(
    `SELECT o.organizacionId, o.nombre, o.tipo,
            (SELECT COUNT(*) FROM OrganizacionMiembro om WHERE om.organizacionId = o.organizacionId) AS totalMiembros,
            (SELECT COUNT(*) FROM Candidato ca WHERE ca.organizacionId = o.organizacionId) AS totalCandidatos
     FROM Organizacion o
     ORDER BY o.nombre`
  );
  return rows;
}

async function listarBasico() {
  const [rows] = await db.query('SELECT organizacionId, nombre, tipo FROM Organizacion ORDER BY nombre');
  return rows;
}

async function crear({ nombre, tipo }) {
  const [result] = await db.query('INSERT INTO Organizacion (nombre, tipo) VALUES (?, ?)', [nombre, tipo || 'partido']);
  return result.insertId;
}

async function actualizar(id, { nombre, tipo }) {
  await db.query('UPDATE Organizacion SET nombre = ?, tipo = ? WHERE organizacionId = ?', [nombre, tipo || 'partido', id]);
}

async function eliminar(id) {
  const [result] = await db.query('DELETE FROM Organizacion WHERE organizacionId = ?', [id]);
  return result.affectedRows;
}

async function agregarMiembro({ dni, organizacionId, rolInterno }) {
  await db.query(
    'INSERT INTO OrganizacionMiembro (dni, organizacionId, rolInterno) VALUES (?, ?, ?)',
    [dni, organizacionId, rolInterno || 'Miembro']
  );
}

async function quitarMiembro(dni, organizacionId) {
  const [result] = await db.query(
    'DELETE FROM OrganizacionMiembro WHERE dni = ? AND organizacionId = ?', [dni, organizacionId]
  );
  return result.affectedRows;
}

async function listarDeUsuario(dni) {
  const [rows] = await db.query(
    `SELECT o.organizacionId, o.nombre, o.tipo, om.rolInterno
     FROM OrganizacionMiembro om
     JOIN Organizacion o ON om.organizacionId = o.organizacionId
     WHERE om.dni = ?
     ORDER BY o.nombre`,
    [dni]
  );
  return rows;
}

module.exports = { listarCatalogo, listarBasico, crear, actualizar, eliminar, agregarMiembro, quitarMiembro, listarDeUsuario };
