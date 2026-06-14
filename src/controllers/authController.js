const db = require('../config/database');

async function loginUsuario(req, res) {
  const { dni } = req.body;
  if (!dni)
    return res.status(400).json({ error: 'DNI requerido.' });
  try{
    const [rows] = await db.query(
      `SELECT u.DNI, u.nombre, u.rol, c.cargoId, c.nombre AS cargo, p.partidoId, p.nombre AS partido, d.distritoId, d.nombre AS distrito
       FROM Usuario u LEFT JOIN Cargo c ON u.cargoId = c.cargoId LEFT JOIN PartidoPolitico p ON u.partidoId = p.partidoId LEFT JOIN Distrito d 
       ON u.distritoId = d.distritoId
       WHERE u.DNI = ?`, [dni]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    const usuario = rows[0];
    req.session.usuario = usuario;
    return res.json({ ok: true, usuario });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}

async function loginAdmin(req, res) {
  const { dni, contrasena } = req.body;
  if (!dni || !contrasena)
    return res.status(400).json({ error: 'DNI y contraseña requeridos.' });
  try {
    const [rows] = await db.query(
      `SELECT u.DNI, u.nombre, u.rol, c.cargoId, c.nombre AS cargo, p.partidoId, p.nombre AS partido, d.distritoId, d.nombre AS distrito
       FROM Usuario u LEFT JOIN Cargo c ON u.cargoId = c.cargoId LEFT JOIN PartidoPolitico p ON u.partidoId = p.partidoId LEFT JOIN Distrito d ON u.distritoId = d.distritoId
       WHERE u.DNI = ? AND u.contrasena = ? AND u.rol = 'admin'`, [dni, contrasena]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    req.session.usuario = rows[0];
    return res.json({ ok: true, usuario: rows[0] });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor.' });
  }
}

function logout(req, res) {
  req.session.destroy();
  return res.json({ ok: true });
}

function getSession(req, res) {
  if (req.session.usuario) {
    const tipo = req.session.usuario.rol === 'admin' ? 'admin' : 'usuario';
    return res.json({ tipo, data: req.session.usuario });
  }
  return res.json({ tipo: null });
}

module.exports = {loginUsuario, loginAdmin, logout, getSession };