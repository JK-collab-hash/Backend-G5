class Organizacion {
  static TIPOS = ['partido', 'institucion', 'empresa', 'otro'];

  constructor({ organizacionId, nombre, tipo }) {
    this.organizacionId = organizacionId;
    this.nombre = nombre;
    this.tipo = tipo;
  }

  static validar({ nombre, tipo }) {
    if (!nombre) return 'El nombre de la organización es obligatorio.';
    if (tipo && !Organizacion.TIPOS.includes(tipo)) {
      return `El tipo debe ser uno de: ${Organizacion.TIPOS.join(', ')}.`;
    }
    return null;
  }
}

module.exports = Organizacion;
