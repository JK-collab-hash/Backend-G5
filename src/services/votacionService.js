const votacionRepository = require('../repositories/votacionRepository');
const Votacion = require('../models/Votacion');

async function getVotacionesDisponibles(usuario) {
  const votaciones = await votacionRepository.listarActivasVigentes();
  const organizacionesUsuario = await votacionRepository.organizacionesDeUsuario(usuario.DNI);
  const ubicacion = await votacionRepository.ubicacionDeDistrito(usuario.distritoId);

  const visibles = votaciones.filter(v => Votacion.esVisiblePara(v, usuario, organizacionesUsuario, ubicacion));

  return Promise.all(visibles.map(async (v) => {
    if (v.tipo === 'referendum') {
      const norma = await votacionRepository.normaDeVotacion(v.votacionId);
      return { ...v, norma };
    }
    const candidatos = await votacionRepository.candidatosDeVotacion(v.votacionId);
    return { ...v, candidatos };
  }));
}

async function registrarVoto(usuario, { votacionId, candidatoId, opcion }) {
  if (!votacionId) 
    return { error: { status: 400, mensaje: 'votacionId es requerido.' } };
  if (!candidatoId && !opcion) {
    return { error: { status: 400, mensaje: 'Debes enviar candidatoId (elección) u opcion (referéndum).' } };
  }

  const votacion = await votacionRepository.findActivaVigentePorId(votacionId);
  if (!votacion) 
    return { error: { status: 404, mensaje: 'Votación no encontrada o inactiva.' } };

  if (await votacionRepository.yaVoto(usuario.DNI, votacionId)) {
    return { error: { status: 400, mensaje: 'Ya emitiste tu voto en esta votación.' } };
  }

  if (votacion.tipo === 'referendum') {
    if (!['a_favor', 'en_contra'].includes(opcion)) {
      return { error: { status: 400, mensaje: 'opcion debe ser "a_favor" o "en_contra".' } };
    }
    const norma = await votacionRepository.normaDeVotacion(votacionId);
    if (!norma) 
      return { error: { status: 404, mensaje: 'Esta votación no tiene una norma asociada.' } };
    await votacionRepository.registrarVotoReferendum({ votacionId, normaId: norma.normaId, opcion, distritoId: usuario.distritoId });
  } else {
    if (!candidatoId) 
      return { error: { status: 400, mensaje: 'candidatoId es requerido para esta votación.' } };
    const candidato = await require('../repositories/candidatoRepository').findById(candidatoId);
    if (!candidato) 
      return { error: { status: 404, mensaje: 'Candidato no encontrado.' } };
    await votacionRepository.registrarVotoCandidato({
      votacionId, candidatoId, organizacionId: candidato.organizacionId,
      cargoId: votacion.cargoId, distritoId: usuario.distritoId,
    });
  }

  await votacionRepository.registrarVotoRegistro(usuario.DNI, votacionId);
  return { mensaje: '¡Voto registrado exitosamente!' };
}

async function getResultados() {
  const [candidatos, referendums] = await Promise.all([
    votacionRepository.resultadosCandidatos(),
    votacionRepository.resultadosReferendums(),
  ]);
  return { candidatos, referendums };
}

async function crearVotacion(datos) {
  const errorValidacion = Votacion.validarCreacion(datos);
  if (errorValidacion) return { error: { status: 400, mensaje: errorValidacion } };

  const votacionId = await votacionRepository.crear(datos);

  if (datos.tipo === 'referendum') {
    await votacionRepository.crearNorma(votacionId, datos.norma);
  } else if (Array.isArray(datos.candidatos) && datos.candidatos.length > 0) {
    await votacionRepository.asociarCandidatos(votacionId, datos.candidatos);
  }

  return { votacionId };
}

async function toggleVotacion(id) {
  const votacion = await votacionRepository.findById(id);
  if (!votacion) return { error: { status: 404, mensaje: 'Votación no encontrada.' } };

  if (votacion.fechaCierreReal) {
    return { error: { status: 400, mensaje: 'Esta votación fue cerrada definitivamente y no se puede reactivar.' } };
  }

  const nuevoEstado = !votacion.activa;
  if (nuevoEstado === true && new Date(votacion.fecha_fin) <= new Date()) {
    return { error: { status: 400, mensaje: 'No se puede reactivar: el plazo de esta votación ya finalizó.' } };
  }
  await votacionRepository.actualizarEstado(id, nuevoEstado);
  return { activa: nuevoEstado };
}

async function cerrarVotacion(id) {
  const votacion = await votacionRepository.findById(id);
  if (!votacion) return { error: { status: 404, mensaje: 'Votación no encontrada.' } };

  if (votacion.fechaCierreReal) {
    return { error: { status: 400, mensaje: 'Esta votación ya fue cerrada definitivamente.' } };
  }

  await votacionRepository.actualizarCierre(id);
  
  if (votacion.tipo === 'referendum') {
    return { mensaje: 'Referéndum cerrado. Revisa los resultados en el panel.' };
  }

  const conteo = await votacionRepository.conteoPorCandidato(id);
  if (conteo.length === 0) {
    return { mensaje: 'Votación cerrada. Sin votos registrados, no hay ganador.' };
  }

  const top = conteo[0].total;
  const empatados = conteo.filter(c => c.total === top);
  
  if (empatados.length > 1) {
    const nombresEmpate = empatados.map(e => `candidato #${e.candidatoId} (${e.total} votos)`).join(', ');
    return {
      mensaje: `Votación cerrada. Empate entre: ${nombresEmpate}. Asigna el cargo manualmente.`,
      empate: true,
      candidatos: empatados,
    };
  }

  const ganadorId = conteo[0].candidatoId;
  const candidato = await require('../repositories/candidatoRepository').findById(ganadorId);
  if (!candidato) {
    return { mensaje: 'Votación cerrada, pero no se encontró al candidato ganador.' };
  }

  await require('../repositories/usuarioRepository').asignarCargo(candidato.dni, candidato.cargoId);
  return { mensaje: 'Votación cerrada y cargo asignado al ganador.', ganadorDni: candidato.dni, cargoId: candidato.cargoId };
}

function calcularEstado(v) {
  if (v.fechaCierreReal) return 'Cerrada anticipadamente';
  if (!v.activa || new Date(v.fecha_fin) <= new Date()) return 'Finalizada';
  return 'En curso';
}

async function getRegistro() {
  const votaciones = await votacionRepository.registroVotaciones();

  return Promise.all(votaciones.map(async (v) => {
    const estado = calcularEstado(v);
    let resultado = null;

    if (estado !== 'En curso') {
      if (v.tipo === 'referendum') {
        const ganador = await votacionRepository.ganadorReferendum(v.votacionId);
        if (ganador && ganador.total_votos > 0) {
          resultado = `${ganador.opcion === 'a_favor' ? 'A favor' : 'En contra'} (${ganador.total_votos} votos)`;
        }
      } else {
        const ganador = await votacionRepository.ganadorCandidato(v.votacionId);
        if (ganador && ganador.total_votos > 0) {
          resultado = `${ganador.nombre} (${ganador.total_votos} votos)`;
        }
      }
    }

    return { ...v, estado, resultado };
  }));
}

module.exports = { getVotacionesDisponibles, registrarVoto, getResultados, crearVotacion, toggleVotacion, cerrarVotacion, getRegistro };
