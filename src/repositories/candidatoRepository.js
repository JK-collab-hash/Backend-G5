const db = require('../config/database');

async function findById(candidatoId) {
  const [rows] = await db.query('SELECT dni, cargoId FROM Candidato WHERE candidatoId = ?', [candidatoId]);
  return rows[0] || null;
}

async function listar({ cargoId, organizacionId, distritoId, provinciaId, departamentoId, tipo }) {
  const condiciones = [];
  const params = [];
  if (cargoId) { condiciones.push('ca.cargoId = ?'); params.push(cargoId); }
  if (organizacionId) { condiciones.push('ca.organizacionId = ?'); params.push(organizacionId); }
  if (distritoId) { condiciones.push('u.distritoId = ?'); params.push(distritoId); }
  if (provinciaId) { condiciones.push('p.provinciaId = ?'); params.push(provinciaId); }
  if (departamentoId) { condiciones.push('dep.departamentoId = ?'); params.push(departamentoId); }
  if (tipo && !cargoId) { condiciones.push('c.tipo = ?'); params.push(tipo); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT ca.candidatoId, u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.distritoId, d.nombre AS distrito, p.provinciaId, p.nombre AS provincia, 
      dep.departamentoId, dep.nombre AS departamento, ca.cargoId, c.nombre AS cargo, c.tipo AS cargoTipo, ca.organizacionId, o.nombre AS organizacionPostula,
      GROUP_CONCAT(CONCAT(om_o.nombre, ' (', om.rolInterno, ')') SEPARATOR ', ') AS organizaciones
     FROM Candidato ca JOIN Usuario u ON ca.dni = u.DNI LEFT JOIN Distrito d ON u.distritoId = d.distritoId LEFT JOIN Provincia p ON d.provinciaId = p.provinciaId
     LEFT JOIN Departamento dep ON p.departamentoId = dep.departamentoId
     LEFT JOIN Cargo c ON ca.cargoId = c.cargoId
     LEFT JOIN Organizacion o ON ca.organizacionId = o.organizacionId
     LEFT JOIN OrganizacionMiembro om ON om.dni = u.DNI
     LEFT JOIN Organizacion om_o ON om_o.organizacionId = om.organizacionId
     ${where}
     GROUP BY ca.candidatoId, u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.distritoId, d.nombre, p.provinciaId, p.nombre, dep.departamentoId, dep.nombre, 
     ca.cargoId, c.nombre, c.tipo, ca.organizacionId, o.nombre
     ORDER BY u.nombre`,
    params
  );
  return rows;
}

async function crear({ dni, cargoId, organizacionId }) {
  const [result] = await db.query(
    'INSERT INTO Candidato (dni, cargoId, organizacionId) VALUES (?, ?, ?)',
    [dni, cargoId, organizacionId || null]
  );
  return result.insertId;
}

async function actualizar(candidatoId, { cargoId, organizacionId }) {
  const [result] = await db.query(
    'UPDATE Candidato SET cargoId = ?, organizacionId = ? WHERE candidatoId = ?',
    [cargoId, organizacionId || null, candidatoId]
  );
  return result.affectedRows;
}

async function eliminar(candidatoId) {
  const [result] = await db.query('DELETE FROM Candidato WHERE candidatoId = ?', [candidatoId]);
  return result.affectedRows;
}

module.exports = { findById, listar, crear, actualizar, eliminar };
