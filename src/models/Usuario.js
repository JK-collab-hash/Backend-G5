class Usuario {
  constructor({ DNI, nombre, apellidoP, apellidoM, rol, cargoId, distritoId, cargo, distrito, organizaciones, esCandidato }) {
    this.DNI = DNI;
    this.nombre = nombre;
    this.apellidoP = apellidoP;
    this.apellidoM = apellidoM;
    this.rol = rol;
    this.cargoId = cargoId ?? null;
    this.distritoId = distritoId ?? null;
    if (cargo !== undefined) this.cargo = cargo;
    if (distrito !== undefined) this.distrito = distrito;
    if (organizaciones !== undefined) this.organizaciones = organizaciones;
    if (esCandidato !== undefined) this.esCandidato = !!esCandidato;
  }

  static ROLES = ['usuario', 'admin'];
  
  static validar({ DNI, nombre, apellidoP, apellidoM, distritoId }) {
    const errores = [];
    if (!DNI || !nombre || !apellidoP || !apellidoM || !distritoId) {
      errores.push('DNI, nombre, apellidos y distrito son obligatorios.');
      return errores;
    }
    if (!Usuario.esDNIValido(DNI)) {
      errores.push('El DNI debe tener 8 caracteres y ser numérico.');
    }
    if (!Usuario.esNombreValido(nombre) || !Usuario.esNombreValido(apellidoP) || !Usuario.esNombreValido(apellidoM)) {
      errores.push('El nombre y los apellidos solo pueden contener letras.');
    }
    return errores;
  }

  static esDNIValido(DNI) {
    return !!DNI && DNI.length === 8 && /^\d+$/.test(DNI);
  }

  static esNombreValido(texto) {
    return !!texto && /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(texto);
  }

  static MIN_LARGO_CONTRASEÑA = 9;

  static esContraseñaValida(contraseña) {
    return typeof contraseña === 'string' && contraseña.length >= Usuario.MIN_LARGO_CONTRASEÑA;
  }
}

module.exports = Usuario;
