const db = require('../config/database');

async function getVotacionesDisponibles(req, res) { 
  const usuario = req.session.usuario || req.session.admin;
  if(!usuario)
    return res.status(401).json({ error: 'No autenticado.' });
  try{
    const [votaciones] = await db.query(
      `SELECT v.votacionId, v.titulo, v.tipo, v.activa, v.cargoId, v.partidoId, v.distritoId FROM Votacion v
       WHERE v.activa = TRUE
        AND v.fecha_ini <= NOW()
        AND v.fecha_fin >= NOW()`
    );

    const visibles = votaciones.filter(v => {
      if (v.tipo === 'nacional')
        return true; 
      if (v.tipo === 'referendum')
        return true;
      if (v.tipo === 'distrital')
        return Number(v.distritoId) === Number(usuario.distritoId);
      if (v.tipo === 'institucional')
        return Number(v.cargoId) === Number(usuario.cargoId);
      if (v.tipo === 'partido')
        return Number(v.partidoId) === Number(usuario.partidoId);
      return false;
    });

    const resultado = await Promise.all(visibles.map(async (v) => {
      const [candidatos] = await db.query(
        `SELECT c.candidatoId, c.nombre, p.nombre AS partido FROM VotacionCandidato vc
         JOIN Candidato c ON vc.candidatoId = c.candidatoId
         LEFT JOIN PartidoPolitico p ON c.partidoId = p.partidoId
         WHERE vc.votacionId = ?`,
        [v.votacionId] 
      );
      return { ...v, candidatos }; 
    }));

    return res.json(resultado);
  } catch (err) {
    console.error(err); 
    return res.status(500).json({ error: 'Error obteniendo votaciones.' });
  }
}

async function registrarVoto(req, res) { 
  const usuario = req.session.usuario || req.session.admin;
  if(!usuario)
    return res.status(401).json({ error: 'No autenticado.' });

  const { votacionId, candidatoId } = req.body;
  if (!votacionId || !candidatoId)
    return res.status(400).json({ error: 'votacionId y candidatoId requeridos.' });
  try {
    const [vots] = await db.query( 
      'SELECT * FROM Votacion WHERE votacionId = ? AND activa = TRUE AND fecha_ini <= NOW() AND fecha_fin >= NOW()', [votacionId]
    );
    if (vots.length === 0) 
      return res.status(404).json({ error: 'Votación no encontrada o inactiva.' });
    const [yaVoto] = await db.query(
      'SELECT * FROM VotoRegistro WHERE dni = ? AND votacionId = ?',
      [usuario.DNI, votacionId]
    );
    if (yaVoto.length > 0)
      return res.status(400).json({ error: 'Ya emitiste tu voto en esta votación.' });
    const [cands] = await db.query( 
      'SELECT * FROM Candidato WHERE candidatoId = ?', [candidatoId]
    );
    const candidato = cands[0]; 
    await db.query(
      `INSERT INTO Voto (votacionId, candidatoId, partidoId, cargoId, distritoId)
       VALUES (?, ?, ?, ?, ?)`,
       [votacionId, candidatoId, candidato.partidoId, vots[0].cargoId || null, usuario.distritoId || null]
    );
    await db.query( 
      'INSERT INTO VotoRegistro (dni, votacionId) VALUES (?, ?)',
      [usuario.DNI, votacionId]
    );
    return res.json({ ok: true, mensaje: '¡Voto registrado exitosamente!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error registrando voto.' });
  }
}

async function getResultados(req, res) {
  if(!req.session.admin && !req.session.usuario) return res.status(401).json({ error: 'No autenticado.' });
  try {
    const [resultados] = await db.query(
      `SELECT v.votacionId, v.titulo, v.tipo, v.activa, c.nombre AS candidato, COUNT(vo.votoId) AS total_votos, MAX(p.nombre)
       AS partido FROM Votacion v
       LEFT JOIN VotacionCandidato vc ON vc.votacionId = v.votacionId
       LEFT JOIN Candidato c ON vc.candidatoId = c.candidatoId
       LEFT JOIN Voto vo ON vo.votacionId = v.votacionId AND vo.candidatoId = c.candidatoId
       LEFT JOIN PartidoPolitico p ON c.partidoId = p.partidoId
       GROUP BY v.votacionId, v.titulo, v.tipo, v.activa, c.candidatoId, c.nombre ORDER BY v.votacionId, total_votos DESC`);
       return res.json(resultados);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Error obteniendo resultados.' });
  }
}

async function crearVotacion(req, res) { 
  if(!req.session.usuario || req.session.usuario.rol !== 'admin')
    return res.status(401).json({ error: 'Solo administradores.' });
  const { titulo, tipo, cargoId, partidoId, distritoId, candidatos, fecha_ini, fecha_fin } = req.body;
  if(!titulo || !tipo || !fecha_ini) 
    return res.status(400).json({ error: 'titulo, tipo y fecha_ini son requeridos.' }); 
  try{
    const [result] = await db.query(
      `INSERT INTO Votacion (titulo, tipo, cargoId, partidoId, distritoId, fecha_ini, fecha_fin) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, tipo, cargoId ? parseInt(cargoId) : null, partidoId ? parseInt(partidoId) : null, distritoId ? parseInt(distritoId) : null, fecha_ini, fecha_fin || null]);
    const votacionId = result.insertId;
    if (Array.isArray(candidatos) && candidatos.length > 0) {
      const values = candidatos.map(cid => [votacionId, cid]);
      await db.query('INSERT INTO VotacionCandidato (votacionId, candidatoId) VALUES ?', [values]);
    }

    return res.status(201).json({ ok: true, votacionId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creando votación.' });
  }
}

async function toggleVotacion(req, res) { 
  if(!req.session.usuario || req.session.usuario.rol !== 'admin')
    return res.status(401).json({ error: 'Solo administradores.' });
  const { id } = req.params;
  try{
    const [rows] = await db.query(
      'SELECT activa FROM Votacion WHERE votacionId = ?', [id]
    );
    if(rows.length === 0) 
      return res.status(404).json({ error: 'Votación no encontrada.' });
    const nuevoEstado = !rows[0].activa;
    await db.query(
      'UPDATE Votacion SET activa = ? WHERE votacionId = ?',
      [nuevoEstado, id]
    );
    return res.json({ ok: true, activa: nuevoEstado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error actualizando votación.' });
  }
}
module.exports = {getVotacionesDisponibles, registrarVoto, getResultados, crearVotacion, toggleVotacion};