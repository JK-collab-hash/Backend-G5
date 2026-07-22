class Candidato {
  constructor({ candidatoId, dni, cargoId, organizacionId }) {
    this.candidatoId = candidatoId;
    this.dni = dni;
    this.cargoId = cargoId;
    this.organizacionId = organizacionId ?? null;
  }

  static validarCreacion({ dni, cargoId }) {
    if (!dni || !cargoId) return 'DNI y cargo al que postula son obligatorios.';
    const Usuario = require('./Usuario');
    if (!Usuario.esDNIValido(dni)) return 'El DNI debe tener 8 caracteres y ser numérico.';
    return null;
  }

  static validarActualizacion({ cargoId }) {
    if (!cargoId) return 'El cargo al que postula es obligatorio.';
    return null;
  }
}

module.exports = Candidato;
