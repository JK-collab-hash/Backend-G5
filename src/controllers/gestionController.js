const db = require('../config/database');

function esAdmin(req) {
  return req.session.usuario && req.session.usuario.rol === 'admin';
}

function validarDNI(DNI) {
  return DNI && DNI.length === 8 && /^\d+$/.test(DNI);
}

function validarNombre(texto) {
  return texto && /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(texto);
}

async function listarUsuarios(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.rol,
              c.nombre AS cargo, d.nombre AS distrito,
              GROUP_CONCAT(CONCAT(o.nombre, ' (', om.rolInterno, ')') SEPARATOR ', ') AS organizaciones
       FROM Usuario u
       LEFT JOIN Cargo c ON u.cargoId = c.cargoId
       LEFT JOIN Distrito d ON u.distritoId = d.distritoId
       LEFT JOIN OrganizacionMiembro om ON om.dni = u.DNI
       LEFT JOIN Organizacion o ON o.organizacionId = om.organizacionId
       WHERE u.rol = 'usuario'
         AND NOT EXISTS (SELECT 1 FROM Candidato ca WHERE ca.dni = u.DNI)
       GROUP BY u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.rol, c.nombre, d.nombre
       ORDER BY u.DNI`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearUsuario(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId } = req.body;

  if (!DNI || !nombre || !apellidoP || !apellidoM || !contraseña || !distritoId) {
    return res.status(400).json({ error: 'DNI, nombre, apellidos, contraseña y distrito son obligatorios.' });
  }
  if (!validarDNI(DNI)) {
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  }
  if (!validarNombre(nombre) || !validarNombre(apellidoP) || !validarNombre(apellidoM)) {
    return res.status(400).json({ error: 'El nombre y los apellidos solo pueden contener letras.' });
  }

  try {
    await db.query(
      `INSERT INTO Usuario (DNI, nombre, apellidoP, apellidoM, rol, contraseña, cargoId, distritoId)
       VALUES (?, ?, ?, ?, 'usuario', ?, ?, ?)`,
      [DNI, nombre, apellidoP, apellidoM, contraseña, cargoId || null, distritoId]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [existente] = await db.query(
        'SELECT nombre, apellidoP, apellidoM FROM Usuario WHERE DNI = ?', [DNI]
      );
      const dueno = existente[0];
      const detalle = dueno ? ` (registrado a nombre de ${dueno.nombre} ${dueno.apellidoP} ${dueno.apellidoM})` : '';
      return res.status(409).json({ error: `Ya existe un usuario con ese DNI${detalle}.` });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function listarAdmins(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [rows] = await db.query(
      `SELECT u.DNI, u.nombre, u.apellidoP, u.apellidoM,
              c.nombre AS cargo, d.nombre AS distrito,
              GROUP_CONCAT(CONCAT(o.nombre, ' (', om.rolInterno, ')') SEPARATOR ', ') AS organizaciones
       FROM Usuario u
       LEFT JOIN Cargo c ON u.cargoId = c.cargoId
       LEFT JOIN Distrito d ON u.distritoId = d.distritoId
       LEFT JOIN OrganizacionMiembro om ON om.dni = u.DNI
       LEFT JOIN Organizacion o ON o.organizacionId = om.organizacionId
       WHERE u.rol = 'admin'
       GROUP BY u.DNI, u.nombre, u.apellidoP, u.apellidoM, c.nombre, d.nombre
       ORDER BY u.DNI`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearAdmin(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId } = req.body;
  if (!DNI || !nombre || !apellidoP || !apellidoM || !contraseña || !distritoId) {
    return res.status(400).json({ error: 'DNI, nombre, apellidos, contraseña y distrito son requeridos.' });
  }
  if (!validarDNI(DNI)) {
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  }
  if (!validarNombre(nombre) || !validarNombre(apellidoP) || !validarNombre(apellidoM)) {
    return res.status(400).json({ error: 'El nombre y los apellidos solo pueden contener letras.' });
  }

  try {
    await db.query(
      `INSERT INTO Usuario (DNI, nombre, apellidoP, apellidoM, rol, contraseña, cargoId, distritoId)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, ?)`,
      [DNI, nombre, apellidoP, apellidoM, contraseña, cargoId || null, distritoId]
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [existente] = await db.query(
        'SELECT nombre, apellidoP, apellidoM FROM Usuario WHERE DNI = ?', [DNI]
      );
      const dueno = existente[0];
      const detalle = dueno ? ` (registrado a nombre de ${dueno.nombre} ${dueno.apellidoP} ${dueno.apellidoM})` : '';
      return res.status(409).json({ error: `Ya existe un administrador con ese DNI${detalle}.` });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarCuenta(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const dniActual = req.params.dni;
  const { DNI, nombre, apellidoP, apellidoM, contraseña, distritoId, cargoId } = req.body;

  if (!DNI || !nombre || !apellidoP || !apellidoM || !distritoId) {
    return res.status(400).json({ error: 'DNI, nombre, apellidos y distrito son obligatorios.' });
  }
  if (!validarDNI(DNI)) {
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  }
  if (!validarNombre(nombre) || !validarNombre(apellidoP) || !validarNombre(apellidoM)) {
    return res.status(400).json({ error: 'El nombre y los apellidos solo pueden contener letras.' });
  }

  const campos = ['DNI = ?', 'nombre = ?', 'apellidoP = ?', 'apellidoM = ?', 'cargoId = ?', 'distritoId = ?'];
  const params = [DNI, nombre, apellidoP, apellidoM, cargoId || null, distritoId];

  if (contraseña) {
    campos.push('contraseña = ?');
    params.push(contraseña);
  }
  params.push(dniActual);

  try {
    const [result] = await db.query(
      `UPDATE Usuario SET ${campos.join(', ')} WHERE DNI = ?`,
      params
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con ese DNI.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe otra cuenta con ese DNI.' });
    }
    // Si el DNI cambió y las FKs no tienen ON UPDATE CASCADE, MySQL lanzará
    // ER_ROW_IS_REFERENCED_2 aquí. Ver migración adjunta (ON UPDATE CASCADE).
    return res.status(500).json({ error: err.message });
  }
}

async function listarCandidatos(req, res) {
  const { cargoId, organizacionId, distritoId, provinciaId, departamentoId, tipo } = req.query;
  try {
    const condiciones = [];
    const params = [];

    if (cargoId) {
      condiciones.push('ca.cargoId = ?');
      params.push(cargoId);
    }
    if (organizacionId) {
      condiciones.push('ca.organizacionId = ?');
      params.push(organizacionId);
    }
    if (distritoId) {
      condiciones.push('u.distritoId = ?');
      params.push(distritoId);
    }
    if (provinciaId) {
      condiciones.push('p.provinciaId = ?');
      params.push(provinciaId);
    }
    if (departamentoId) {
      condiciones.push('dep.departamentoId = ?');
      params.push(departamentoId);
    }
    if (tipo && !cargoId) {
      condiciones.push('c.tipo = ?');
      params.push(tipo);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT ca.candidatoId, u.DNI, u.nombre, u.apellidoP, u.apellidoM,
              u.distritoId, d.nombre AS distrito,
              p.provinciaId, p.nombre AS provincia,
              dep.departamentoId, dep.nombre AS departamento,
              ca.cargoId, c.nombre AS cargo, c.tipo AS cargoTipo,
              ca.organizacionId, o.nombre AS organizacionPostula,
              GROUP_CONCAT(CONCAT(om_o.nombre, ' (', om.rolInterno, ')') SEPARATOR ', ') AS organizaciones
       FROM Candidato ca
       JOIN Usuario u ON ca.dni = u.DNI
       LEFT JOIN Distrito d ON u.distritoId = d.distritoId
       LEFT JOIN Provincia p ON d.provinciaId = p.provinciaId
       LEFT JOIN Departamento dep ON p.departamentoId = dep.departamentoId
       LEFT JOIN Cargo c ON ca.cargoId = c.cargoId
       LEFT JOIN Organizacion o ON ca.organizacionId = o.organizacionId
       LEFT JOIN OrganizacionMiembro om ON om.dni = u.DNI
       LEFT JOIN Organizacion om_o ON om_o.organizacionId = om.organizacionId
       ${where}
       GROUP BY ca.candidatoId, u.DNI, u.nombre, u.apellidoP, u.apellidoM, u.distritoId, d.nombre,
                p.provinciaId, p.nombre, dep.departamentoId, dep.nombre,
                ca.cargoId, c.nombre, c.tipo, ca.organizacionId, o.nombre
       ORDER BY u.nombre`,
      params
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearCandidato(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { dni, cargoId, organizacionId } = req.body;

  if (!dni || !cargoId) {
    return res.status(400).json({ error: 'DNI y cargo al que postula son obligatorios.' });
  }
  if (!validarDNI(dni)) {
    return res.status(400).json({ error: 'El DNI debe tener 8 caracteres y ser numérico.' });
  }

  try {
    const [usuarioExiste] = await db.query('SELECT DNI FROM Usuario WHERE DNI = ?', [dni]);
    if (usuarioExiste.length === 0) {
      return res.status(404).json({ error: 'No existe un usuario con ese DNI. Crea el usuario primero.' });
    }

    const [result] = await db.query(
      'INSERT INTO Candidato (dni, cargoId, organizacionId) VALUES (?, ?, ?)',
      [dni, cargoId, organizacionId || null]
    );
    return res.status(201).json({ ok: true, candidatoId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esta persona ya postula a ese cargo.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/* Edita el cargo y/o la organización de una postulación existente.
   No se "quita" la postulación aquí — para eso está finalizarCandidatura. */
async function actualizarCandidato(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { candidatoId } = req.params;
  const { cargoId, organizacionId } = req.body;

  if (!cargoId) {
    return res.status(400).json({ error: 'El cargo al que postula es obligatorio.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE Candidato SET cargoId = ?, organizacionId = ? WHERE candidatoId = ?',
      [cargoId, organizacionId || null, candidatoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No existe esa postulación.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esta persona ya postula a ese cargo.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/* Termina una postulación puntual (NO borra la cuenta del usuario).
   Al borrar la fila de Candidato, listarUsuarios() vuelve a incluir
   automáticamente a esta persona porque su condición NOT EXISTS ya
   no encuentra ninguna candidatura activa. */
async function finalizarCandidatura(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { candidatoId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM Candidato WHERE candidatoId = ?',
      [candidatoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No existe esa postulación.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function crearCargo(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, tipo } = req.body;

  const tiposValidos = ['nacional', 'distrital', 'provincial', 'departamental', 'institucional', 'partido'];
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cargo es obligatorio.' });
  }
  if (tipo && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}.` });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Cargo (nombre, tipo) VALUES (?, ?)`,
      [nombre, tipo || 'nacional']
    );
    return res.status(201).json({ ok: true, cargoId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cargo con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function crearDepartamento(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del departamento es obligatorio.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Departamento (nombre) VALUES (?)`,
      [nombre]
    );
    return res.status(201).json({ ok: true, departamentoId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un departamento con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function crearProvincia(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, departamentoId } = req.body;

  if (!nombre || !departamentoId) {
    return res.status(400).json({ error: 'El nombre y el departamento son obligatorios.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Provincia (nombre, departamentoId) VALUES (?, ?)`,
      [nombre, departamentoId]
    );
    return res.status(201).json({ ok: true, provinciaId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una provincia con ese nombre en ese departamento.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function crearDistrito(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, provinciaId } = req.body;

  if (!nombre || !provinciaId) {
    return res.status(400).json({ error: 'El nombre y la provincia son obligatorios.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Distrito (nombre, provinciaId) VALUES (?, ?)`,
      [nombre, provinciaId]
    );
    return res.status(201).json({ ok: true, distritoId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un distrito con ese nombre en esa provincia.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function crearOrganizacion(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, tipo } = req.body;

  const tiposValidos = ['partido', 'institucion', 'empresa', 'otro'];
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la organización es obligatorio.' });
  }
  if (tipo && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}.` });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Organizacion (nombre, tipo) VALUES (?, ?)`,
      [nombre, tipo || 'partido']
    );
    return res.status(201).json({ ok: true, organizacionId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una organización con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/* ================= Catálogos: listar / editar / eliminar ================= */
/* Mismo criterio que en cuentas: nada se borra si está en uso en otra tabla.
   Se detecta por el código de MySQL de FK (ER_ROW_IS_REFERENCED_2) en vez de
   hacer un SELECT de verificación por cada tabla relacionada, así no hay que
   mantener esa lista de tablas sincronizada a mano. */
function esErrorDeReferencia(err) {
  return err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED';
}

async function listarCargos(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT c.cargoId, c.nombre, c.tipo,
              (SELECT COUNT(*) FROM Usuario u WHERE u.cargoId = c.cargoId) AS enUsoPersonas,
              (SELECT COUNT(*) FROM Votacion v WHERE v.cargoId = c.cargoId) AS enUsoVotaciones
       FROM Cargo c
       ORDER BY c.nombre`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarCargo(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { id } = req.params;
  const { nombre, tipo } = req.body;
  const tiposValidos = ['nacional', 'distrital', 'provincial', 'departamental', 'institucional', 'partido'];
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cargo es obligatorio.' });
  }
  if (tipo && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}.` });
  }
  try {
    await db.query('UPDATE Cargo SET nombre = ?, tipo = ? WHERE cargoId = ?', [nombre, tipo || 'nacional', id]);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cargo con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarCargo(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [result] = await db.query('DELETE FROM Cargo WHERE cargoId = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cargo no encontrado.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (esErrorDeReferencia(err)) {
      return res.status(409).json({ error: 'No se puede eliminar: este cargo está en uso (personas, candidatos o votaciones).' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function listarDepartamentos(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT dep.departamentoId, dep.nombre,
              (SELECT COUNT(*) FROM Provincia p WHERE p.departamentoId = dep.departamentoId) AS totalProvincias
       FROM Departamento dep
       ORDER BY dep.nombre`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarDepartamento(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del departamento es obligatorio.' });
  }
  try {
    await db.query('UPDATE Departamento SET nombre = ? WHERE departamentoId = ?', [nombre, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un departamento con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarDepartamento(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [result] = await db.query('DELETE FROM Departamento WHERE departamentoId = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Departamento no encontrado.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (esErrorDeReferencia(err)) {
      return res.status(409).json({ error: 'No se puede eliminar: tiene provincias registradas dentro de él.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function listarProvincias(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.provinciaId, p.nombre, p.departamentoId, dep.nombre AS departamento,
              (SELECT COUNT(*) FROM Distrito d WHERE d.provinciaId = p.provinciaId) AS totalDistritos
       FROM Provincia p
       JOIN Departamento dep ON p.departamentoId = dep.departamentoId
       ORDER BY dep.nombre, p.nombre`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarProvincia(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, departamentoId } = req.body;
  if (!nombre || !departamentoId) {
    return res.status(400).json({ error: 'El nombre y el departamento son obligatorios.' });
  }
  try {
    await db.query('UPDATE Provincia SET nombre = ?, departamentoId = ? WHERE provinciaId = ?', [nombre, departamentoId, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una provincia con ese nombre en ese departamento.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarProvincia(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [result] = await db.query('DELETE FROM Provincia WHERE provinciaId = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Provincia no encontrada.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (esErrorDeReferencia(err)) {
      return res.status(409).json({ error: 'No se puede eliminar: tiene distritos registrados dentro de ella.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function listarDistritos(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT d.distritoId, d.nombre, d.provinciaId, p.nombre AS provincia, dep.nombre AS departamento, 
      (SELECT COUNT(*) FROM Usuario u WHERE u.distritoId = d.distritoId) AS enUsoPersonas
       FROM Distrito d JOIN Provincia p ON d.provinciaId = p.provinciaId
       JOIN Departamento dep ON p.departamentoId = dep.departamentoId
       ORDER BY dep.nombre, p.nombre, d.nombre`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarDistrito(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, provinciaId } = req.body;
  if (!nombre || !provinciaId) {
    return res.status(400).json({ error: 'El nombre y la provincia son obligatorios.' });
  }
  try {
    await db.query('UPDATE Distrito SET nombre = ?, provinciaId = ? WHERE distritoId = ?', [nombre, provinciaId, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un distrito con ese nombre en esa provincia.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarDistrito(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [result] = await db.query('DELETE FROM Distrito WHERE distritoId = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Distrito no encontrado.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (esErrorDeReferencia(err)) {
      return res.status(409).json({ error: 'No se puede eliminar: hay personas o votaciones asociadas a este distrito.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function listarOrganizacionesCatalogo(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT o.organizacionId, o.nombre, o.tipo, (SELECT COUNT(*) FROM OrganizacionMiembro om WHERE om.organizacionId = o.organizacionId) AS totalMiembros, 
      (SELECT COUNT(*) FROM Candidato ca WHERE ca.organizacionId = o.organizacionId) AS totalCandidatos
       FROM Organizacion o ORDER BY o.nombre`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function actualizarOrganizacion(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { nombre, tipo } = req.body;
  const tiposValidos = ['partido', 'institucion', 'empresa', 'otro'];
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la organización es obligatorio.' });
  }
  if (tipo && !tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}.` });
  }
  try {
    await db.query('UPDATE Organizacion SET nombre = ?, tipo = ? WHERE organizacionId = ?', [nombre, tipo || 'partido', req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una organización con ese nombre.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function eliminarOrganizacion(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  try {
    const [result] = await db.query('DELETE FROM Organizacion WHERE organizacionId = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Organización no encontrada.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    if (esErrorDeReferencia(err)) {
      return res.status(409).json({ error: 'No se puede eliminar: tiene miembros, candidatos o votaciones asociadas. Quita esas relaciones primero.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function agregarMiembroOrganizacion(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { dni, organizacionId, rolInterno } = req.body;

  if (!dni || !organizacionId) {
    return res.status(400).json({ error: 'DNI y organización son obligatorios.' });
  }

  try {
    const [usuarioExiste] = await db.query('SELECT DNI FROM Usuario WHERE DNI = ?', [dni]);
    if (usuarioExiste.length === 0) {
      return res.status(404).json({ error: 'No existe un usuario con ese DNI.' });
    }

    await db.query(
      `INSERT INTO OrganizacionMiembro (dni, organizacionId, rolInterno)
       VALUES (?, ?, ?)`,
      [dni, organizacionId, rolInterno || 'Miembro']
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Esta persona ya pertenece a esa organización.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function quitarMiembroOrganizacion(req, res) {
  if (!esAdmin(req)) {
    return res.status(401).json({ error: 'Solo administradores.' });
  }
  const { dni, organizacionId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM OrganizacionMiembro WHERE dni = ? AND organizacionId = ?',
      [dni, organizacionId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Esa persona no pertenece a esa organización.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listarOrganizacionesDeUsuario(req, res) {
  const sesion = req.session.usuario;
  if (!sesion) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  const { dni } = req.params;
  const esElMismo = sesion.DNI === dni;
  if (!esElMismo && sesion.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para ver esta información.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT o.organizacionId, o.nombre, o.tipo, om.rolInterno
       FROM OrganizacionMiembro om
       JOIN Organizacion o ON om.organizacionId = o.organizacionId
       WHERE om.dni = ?
       ORDER BY o.nombre`,
      [dni]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCatalogos(req, res) {
  try {
    const [[organizaciones], [distritos], [cargos], [departamentos], [provincias]] = await Promise.all([
      db.query('SELECT organizacionId, nombre, tipo FROM Organizacion ORDER BY nombre'),
      db.query('SELECT distritoId, nombre, provinciaId FROM Distrito ORDER BY nombre'),
      db.query('SELECT cargoId, nombre, tipo FROM Cargo ORDER BY nombre'),
      db.query('SELECT departamentoId, nombre FROM Departamento ORDER BY nombre'),
      db.query('SELECT provinciaId, nombre, departamentoId FROM Provincia ORDER BY nombre')
    ]);
    return res.json({ organizaciones, distritos, cargos, departamentos, provincias });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listarUsuarios, crearUsuario, listarAdmins, crearAdmin, actualizarCuenta,
  listarCandidatos, crearCandidato, actualizarCandidato, finalizarCandidatura,
  crearCargo, crearDepartamento, crearProvincia, crearDistrito, crearOrganizacion,
  agregarMiembroOrganizacion, quitarMiembroOrganizacion, listarOrganizacionesDeUsuario, getCatalogos,
  listarCargos, actualizarCargo, eliminarCargo,
  listarDepartamentos, actualizarDepartamento, eliminarDepartamento,
  listarProvincias, actualizarProvincia, eliminarProvincia,
  listarDistritos, actualizarDistrito, eliminarDistrito,
  listarOrganizacionesCatalogo, actualizarOrganizacion, eliminarOrganizacion
};