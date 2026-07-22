class Departamento {
  constructor({ departamentoId, nombre }) {
    this.departamentoId = departamentoId;
    this.nombre = nombre;
  }
  static validar({ nombre }) {
    return !nombre ? 'El nombre del departamento es obligatorio.' : null;
  }
}

class Provincia {
  constructor({ provinciaId, nombre, departamentoId }) {
    this.provinciaId = provinciaId;
    this.nombre = nombre;
    this.departamentoId = departamentoId;
  }
  static validar({ nombre, departamentoId }) {
    return (!nombre || !departamentoId) ? 'El nombre y el departamento son obligatorios.' : null;
  }
}

class Distrito {
  constructor({ distritoId, nombre, provinciaId }) {
    this.distritoId = distritoId;
    this.nombre = nombre;
    this.provinciaId = provinciaId;
  }
  static validar({ nombre, provinciaId }) {
    return (!nombre || !provinciaId) ? 'El nombre y la provincia son obligatorios.' : null;
  }
}

module.exports = { Departamento, Provincia, Distrito };
