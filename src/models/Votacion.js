class Votacion {
  static TIPOS = ['nacional', 'distrital', 'provincial', 'departamental', 'institucional', 'partido', 'referendum'];

  constructor({ votacionId, titulo, tipo, activa, cargoId, organizacionId, distritoId, provinciaId, departamentoId, fecha_ini, fecha_fin }) {
    this.votacionId = votacionId;
    this.titulo = titulo;
    this.tipo = tipo;
    this.activa = !!activa;
    this.cargoId = cargoId ?? null;
    this.organizacionId = organizacionId ?? null;
    this.distritoId = distritoId ?? null;
    this.provinciaId = provinciaId ?? null;
    this.departamentoId = departamentoId ?? null;
    this.fecha_ini = fecha_ini;
    this.fecha_fin = fecha_fin ?? null;
  }

  static MIN_CANDIDATOS = 2;

  static validarCreacion({ titulo, tipo, cargoId, organizacionId, distritoId, provinciaId, departamentoId, fecha_ini, norma, candidatos }) {
    if (!titulo || !tipo || !fecha_ini) {
      return 'titulo, tipo y fecha_ini son requeridos.';
    }
    if (!Votacion.TIPOS.includes(tipo)) {
      return `tipo debe ser uno de: ${Votacion.TIPOS.join(', ')}.`;
    }
    if (tipo === 'distrital' && !distritoId) return 'El distrito es obligatorio para una votación distrital.';
    if (tipo === 'provincial' && !provinciaId) return 'La provincia es obligatoria para una votación provincial.';
    if (tipo === 'departamental' && !departamentoId) return 'El departamento es obligatorio para una votación departamental.';
    if (tipo === 'institucional' && !cargoId) return 'El cargo/institución es obligatorio para una votación institucional.';
    if (tipo === 'partido' && !organizacionId) return 'La organización es obligatoria para una votación de partido.';
    if (tipo === 'referendum' && (!norma || !norma.titulo)) {
      return 'Para un referéndum debes indicar la norma (al menos el título).';
    }
    if (tipo !== 'referendum') {
      const totalCandidatos = Array.isArray(candidatos) ? new Set(candidatos).size : 0;
      if (totalCandidatos < Votacion.MIN_CANDIDATOS) {
        return `Debes seleccionar al menos ${Votacion.MIN_CANDIDATOS} candidatos para crear esta votación.`;
      }
    }
    return null;
  }
  
  static esVisiblePara(votacion, usuario, organizacionesUsuario, ubicacion) {
    switch (votacion.tipo) {
      case 'nacional':
      case 'referendum':
        return true;
      case 'distrital':
        return Number(votacion.distritoId) === Number(usuario.distritoId);
      case 'provincial':
        return !!ubicacion && Number(votacion.provinciaId) === Number(ubicacion.provinciaId);
      case 'departamental':
        return !!ubicacion && Number(votacion.departamentoId) === Number(ubicacion.departamentoId);
      case 'institucional':
        return Number(votacion.cargoId) === Number(usuario.cargoId);
      case 'partido':
        return organizacionesUsuario.includes(Number(votacion.organizacionId));
      default:
        return false;
    }
  }
}

module.exports = Votacion;
