class Cargo {
  static TIPOS = ['nacional', 'distrital', 'provincial', 'departamental', 'institucional', 'partido'];

  constructor({ cargoId, nombre, tipo }) {
    this.cargoId = cargoId;
    this.nombre = nombre;
    this.tipo = tipo;
  }

  static validar({ nombre, tipo }) {
    if (!nombre) return 'El nombre del cargo es obligatorio.';
    if (tipo && !Cargo.TIPOS.includes(tipo)) {
      return `El tipo debe ser uno de: ${Cargo.TIPOS.join(', ')}.`;
    }
    return null;
  }
}

module.exports = Cargo;
