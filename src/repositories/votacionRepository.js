const db = require('../config/database');

async function listarActivasVigentes() {
  const [rows] = await db.query(
    `SELECT v.votacionId, v.titulo, v.tipo, v.activa, v.cargoId, v.organizacionId, v.distritoId, v.provinciaId, v.departamentoId
     FROM Votacion v
     WHERE v.activa = TRUE
      AND v.fecha_ini <= NOW()
      AND v.fecha_fin >= NOW()`
  );
  return rows;
}

async function organizacionesDeUsuario(dni) {
  const [rows] = await db.query('SELECT organizacionId FROM OrganizacionMiembro WHERE dni = ?', [dni]);
  return rows.map(r => Number(r.organizacionId));
}

async function ubicacionDeDistrito(distritoId) {
  const [rows] = await db.query(
    `SELECT d.distritoId, p.provinciaId, dep.departamentoId
     FROM Distrito d
     JOIN Provincia p ON d.provinciaId = p.provinciaId
     JOIN Departamento dep ON p.departamentoId = dep.departamentoId
     WHERE d.distritoId = ?`,
    [distritoId]
  );
  return rows[0] || null;
}

async function normaDeVotacion(votacionId) {
  const [rows] = await db.query(
    'SELECT normaId, titulo, descripcion FROM Norma WHERE votacionId = ?', [votacionId]
  );
  return rows[0] || null;
}

async function candidatosDeVotacion(votacionId) {
  const [rows] = await db.query(
    `SELECT ca.candidatoId, u.nombre, o.nombre AS organizacion
     FROM VotacionCandidato vc
     JOIN Candidato ca ON vc.candidatoId = ca.candidatoId
     JOIN Usuario u ON ca.dni = u.DNI
     LEFT JOIN Organizacion o ON ca.organizacionId = o.organizacionId
     WHERE vc.votacionId = ?`,
    [votacionId]
  );
  return rows;
}

async function findActivaVigentePorId(votacionId) {
  const [rows] = await db.query(
    'SELECT * FROM Votacion WHERE votacionId = ? AND activa = TRUE AND fecha_ini <= NOW() AND fecha_fin >= NOW()',
    [votacionId]
  );
  return rows[0] || null;
}

async function findById(votacionId) {
  const [rows] = await db.query('SELECT * FROM Votacion WHERE votacionId = ?', [votacionId]);
  return rows[0] || null;
}

async function yaVoto(dni, votacionId) {
  const [rows] = await db.query('SELECT * FROM VotoRegistro WHERE dni = ? AND votacionId = ?', [dni, votacionId]);
  return rows.length > 0;
}

async function registrarVotoReferendum({ votacionId, normaId, opcion, distritoId }) {
  await db.query(
    `INSERT INTO Voto (votacionId, normaId, opcion, distritoId) VALUES (?, ?, ?, ?)`,
    [votacionId, normaId, opcion, distritoId || null]
  );
}

async function registrarVotoCandidato({ votacionId, candidatoId, organizacionId, cargoId, distritoId }) {
  await db.query(
    `INSERT INTO Voto (votacionId, candidatoId, organizacionId, cargoId, distritoId) VALUES (?, ?, ?, ?, ?)`,
    [votacionId, candidatoId, organizacionId, cargoId || null, distritoId || null]
  );
}

async function registrarVotoRegistro(dni, votacionId) {
  await db.query('INSERT INTO VotoRegistro (dni, votacionId) VALUES (?, ?)', [dni, votacionId]);
}

async function resultadosCandidatos() {
  const [rows] = await db.query(
    `SELECT v.votacionId, v.titulo, v.tipo, v.activa, v.fecha_ini, v.fecha_fin, u.nombre AS candidato,
      COUNT(vo.votoId) AS total_votos, MAX(o.nombre) AS organizacion
     FROM Votacion v
     LEFT JOIN VotacionCandidato vc ON vc.votacionId = v.votacionId
     LEFT JOIN Candidato ca ON vc.candidatoId = ca.candidatoId
     LEFT JOIN Usuario u ON ca.dni = u.DNI
     LEFT JOIN Voto vo ON vo.votacionId = v.votacionId AND vo.candidatoId = ca.candidatoId
     LEFT JOIN Organizacion o ON ca.organizacionId = o.organizacionId
     WHERE v.tipo <> 'referendum'
     GROUP BY v.votacionId, v.titulo, v.tipo, v.activa, v.fecha_ini, v.fecha_fin, ca.candidatoId, u.nombre
     ORDER BY v.votacionId, total_votos DESC`
  );
  return rows;
}

async function resultadosReferendums() {
  const [rows] = await db.query(
    `SELECT v.votacionId, v.titulo, v.tipo, v.activa, v.fecha_ini, v.fecha_fin, n.titulo AS norma, vo.opcion, COUNT(vo.votoId) AS total_votos
     FROM Votacion v JOIN Norma n ON n.votacionId = v.votacionId LEFT JOIN Voto vo ON vo.votacionId = v.votacionId AND vo.normaId = n.normaId
     WHERE v.tipo = 'referendum'
     GROUP BY v.votacionId, v.titulo, v.tipo, v.activa, v.fecha_ini, v.fecha_fin, n.titulo, vo.opcion
     ORDER BY v.votacionId`
  );
  return rows;
}

async function crear({ titulo, tipo, cargoId, organizacionId, distritoId, provinciaId, departamentoId, fecha_ini, fecha_fin }) {
  const [result] = await db.query(
    `INSERT INTO Votacion (titulo, tipo, cargoId, organizacionId, distritoId, provinciaId, departamentoId, fecha_ini, fecha_fin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [titulo, 
      tipo,
      cargoId ? parseInt(cargoId) : null,
      organizacionId ? parseInt(organizacionId) : null,
      distritoId ? parseInt(distritoId) : null,
      provinciaId ? parseInt(provinciaId) : null,
      departamentoId ? parseInt(departamentoId) : null,
      fecha_ini, fecha_fin || null]
  );
  return result.insertId;
}

async function crearNorma(votacionId, { titulo, descripcion }) {
  await db.query('INSERT INTO Norma (titulo, descripcion, votacionId) VALUES (?, ?, ?)', [titulo, descripcion || null, votacionId]);
}

async function asociarCandidatos(votacionId, candidatoIds) {
  const values = candidatoIds.map(cid => [votacionId, cid]);
  await db.query('INSERT INTO VotacionCandidato (votacionId, candidatoId) VALUES ?', [values]);
}

async function actualizarEstado(votacionId, activa) {
  await db.query('UPDATE Votacion SET activa = ? WHERE votacionId = ?', [activa, votacionId]);
}

async function conteoPorCandidato(votacionId) {
  const [rows] = await db.query(
    `SELECT candidatoId, COUNT(*) AS total
     FROM Voto
     WHERE votacionId = ? AND candidatoId IS NOT NULL
     GROUP BY candidatoId
     ORDER BY total DESC`,
    [votacionId]
  );
  return rows;
}

async function registroVotaciones() {
  const [rows] = await db.query(
    `SELECT v.votacionId, v.titulo, v.tipo, v.activa, v.fecha_ini, v.fecha_fin, v.fechaCierreReal
     FROM Votacion v
     ORDER BY v.fecha_ini DESC`
  );
  return rows;
}

async function ganadorCandidato(votacionId) {
  const [rows] = await db.query(
    `SELECT u.nombre, COUNT(vo.votoId) AS total_votos
     FROM Voto vo
     JOIN Candidato ca ON vo.candidatoId = ca.candidatoId
     JOIN Usuario u ON ca.dni = u.DNI
     WHERE vo.votacionId = ?
     GROUP BY ca.candidatoId, u.nombre
     ORDER BY total_votos DESC
     LIMIT 1`,
    [votacionId]
  );
  return rows[0] || null;
}

async function ganadorReferendum(votacionId) {
  const [rows] = await db.query(
    `SELECT vo.opcion, COUNT(vo.votoId) AS total_votos
     FROM Voto vo
     WHERE vo.votacionId = ? AND vo.normaId IS NOT NULL
     GROUP BY vo.opcion
     ORDER BY total_votos DESC
     LIMIT 1`,
    [votacionId]
  );
  return rows[0] || null;
}

module.exports = {
  listarActivasVigentes, organizacionesDeUsuario, ubicacionDeDistrito, normaDeVotacion, candidatosDeVotacion, findActivaVigentePorId, findById,
  yaVoto, registrarVotoReferendum, registrarVotoCandidato, registrarVotoRegistro, resultadosCandidatos, resultadosReferendums, crear, crearNorma,
  asociarCandidatos, actualizarEstado, conteoPorCandidato, registroVotaciones, ganadorCandidato, ganadorReferendum,
};
