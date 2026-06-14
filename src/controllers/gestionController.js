const db = require('../config/database');

function esAdmin(req) {
  return req.session.usuario && req.session.usuario.rol === 'admin';
}

async function listarUsuarios(req, res) {
  try{
    const [rows] = await db.query(
      `SELECT u.DNI, u.nombre, u.ya_voto,
              c.nombre AS cargo, p.nombre AS partido, d.nombre AS distrito
       FROM Usuario u
       LEFT JOIN Cargo c ON u.cargoId = c.cargoId
       LEFT JOIN PartidoPolitico p ON u.partidoId = p.partidoId
       LEFT JOIN Distrito d ON u.distritoId = d.distritoId
       WHERE u.rol = 'usuario'
       ORDER BY u.DNI`
    );
    return res.json(rows);
  }catch(err){
    return res.status(500).json({ error: err.message });
  }
}

async function crearUsuario(req, res) {
  if (!esAdmin(req))
    return res.status(401).json({ error: 'Solo administradores.' });
  const { DNI, nombre, cargoId, partidoId, distritoId } = req.body;

  if(!DNI || !nombre || !distritoId)
    return res.status(400).json({ error: 'DNI, nombre y distrito son obligatorios.' });
  if (DNI.length !== 8 || !/^\d+$/.test(DNI))
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  try {
    await db.query(
      `INSERT INTO Usuario (DNI, nombre, rol, cargoId, partidoId, distritoId)
       VALUES (?, ?, 'usuario', ?, ?, ?)`,
      [DNI, nombre, cargoId || null, partidoId || null, distritoId]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe un usuario con ese DNI.' });
    return res.status(500).json({ error: err.message });
  }
}

async function crearAdmin(req, res) {
  if(!esAdmin(req))
    return res.status(401).json({ error: 'Solo administradores.' });
  const { DNI, contrasena, distritoId } = req.body;
  if(!DNI || !contrasena || !distritoId)
    return res.status(400).json({ error: 'DNI, contraseña y distrito son requeridos.' });
  if (DNI.length !== 8 || !/^\d+$/.test(DNI))
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  try{
    await db.query(
      `INSERT INTO Usuario (DNI, nombre, rol, contrasena, distritoId)
       VALUES (?, 'Administrador', 'admin', ?, ?)`,
      [DNI, contrasena, distritoId]
    );
    return res.status(201).json({ ok: true });
  }catch(err){
    if(err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe un administrador con ese DNI.' });
    return res.status(500).json({ error: err.message });
  }
}

async function listarCandidatos(req, res) {
  try{
    const [rows] = await db.query(
      `SELECT c.candidatoId, c.nombre, p.nombre AS partido
       FROM Candidato c
       LEFT JOIN PartidoPolitico p ON c.partidoId = p.partidoId
       ORDER BY c.nombre`
    );
    return res.json(rows);
  }catch(err){
    return res.status(500).json({ error: err.message });
  }
}

async function crearCandidato(req, res) {
  if(!esAdmin(req))
    return res.status(401).json({ error: 'Solo administradores.' });
  const { nombre, partidoId } = req.body;
  if(!nombre)
    return res.status(400).json({ error: 'Nombre requerido.' });
  try{
    const [result] = await db.query(
      'INSERT INTO Candidato (nombre, partidoId) VALUES (?, ?)',
      [nombre, partidoId || null]
    );
    return res.status(201).json({ ok: true, candidatoId: result.insertId });
  }catch(err){
    return res.status(500).json({ error: err.message });
  }
}

async function getCatalogos(req, res) {
  try{
    const [[partidos], [distritos], [cargos]] = await Promise.all([
      db.query('SELECT partidoId, nombre FROM PartidoPolitico ORDER BY nombre'),
      db.query('SELECT distritoId, nombre FROM Distrito ORDER BY nombre'),
      db.query('SELECT cargoId, nombre, tipo FROM Cargo ORDER BY nombre'),
    ]);
    return res.json({ partidos, distritos, cargos });
  }catch(err){
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {listarUsuarios, crearUsuario, crearAdmin, listarCandidatos, crearCandidato, getCatalogos};