CREATE DATABASE bdprueba2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE bdprueba2;

CREATE TABLE Departamento (
  departamentoId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE Provincia (
  provinciaId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  departamentoId INT NOT NULL,
  FOREIGN KEY (departamentoId) REFERENCES Departamento(departamentoId) ON DELETE RESTRICT,
  UNIQUE (nombre, departamentoId)
);
CREATE TABLE Distrito (
  distritoId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  provinciaId INT NOT NULL,
  FOREIGN KEY (provinciaId) REFERENCES Provincia(provinciaId) ON DELETE RESTRICT,
  UNIQUE (nombre, provinciaId)
);
CREATE TABLE Organizacion (
  organizacionId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  tipo ENUM('partido','institucion','empresa','otro') NOT NULL DEFAULT 'partido'
);
CREATE TABLE Cargo (
  cargoId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  tipo ENUM('nacional','distrital','provincial','departamental','institucional','partido') NOT NULL DEFAULT 'nacional'
);
CREATE TABLE Usuario (
  DNI VARCHAR(8) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellidoP VARCHAR(50) NOT NULL,
  apellidoM VARCHAR(50) NOT NULL,
  rol ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  contraseña VARCHAR(50) NOT NULL,
  cargoId INT,
  distritoId INT NOT NULL,
  FOREIGN KEY (cargoId)    REFERENCES Cargo(cargoId)    ON DELETE SET NULL,
  FOREIGN KEY (distritoId) REFERENCES Distrito(distritoId) ON DELETE RESTRICT
);
CREATE TABLE OrganizacionMiembro (
  dni VARCHAR(8) NOT NULL,
  organizacionId INT NOT NULL,
  rolInterno VARCHAR(50) NOT NULL DEFAULT 'Miembro',
  PRIMARY KEY (dni, organizacionId),
  FOREIGN KEY (dni) REFERENCES Usuario(DNI) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (organizacionId) REFERENCES Organizacion(organizacionId) ON DELETE CASCADE
);
CREATE TABLE Candidato (
  candidatoId INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(8) NOT NULL,
  cargoId INT NOT NULL,
  organizacionId INT, 
  FOREIGN KEY (dni) REFERENCES Usuario(DNI) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cargoId) REFERENCES Cargo(cargoId) ON DELETE RESTRICT,
  FOREIGN KEY (organizacionId) REFERENCES Organizacion(organizacionId) ON DELETE SET NULL,
  UNIQUE (dni, cargoId)
);
CREATE TABLE Votacion (
  votacionId INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  tipo ENUM('nacional','distrital','provincial','departamental','institucional','partido','referendum') NOT NULL DEFAULT 'nacional',
  cargoId INT,
  organizacionId INT,
  distritoId INT,
  provinciaId INT,
  departamentoId INT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_ini DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  fechaCierreReal DATETIME,
  FOREIGN KEY (cargoId) REFERENCES Cargo(cargoId) ON DELETE SET NULL,
  FOREIGN KEY (organizacionId) REFERENCES Organizacion(organizacionId) ON DELETE SET NULL,
  FOREIGN KEY (distritoId) REFERENCES Distrito(distritoId) ON DELETE SET NULL,
  FOREIGN KEY (provinciaId) REFERENCES Provincia(provinciaId) ON DELETE SET NULL,
  FOREIGN KEY (departamentoId) REFERENCES Departamento(departamentoId) ON DELETE SET NULL
);
CREATE TABLE Norma (
  normaId INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  votacionId INT NOT NULL UNIQUE,
  FOREIGN KEY (votacionId) REFERENCES Votacion(votacionId) ON DELETE CASCADE
);
CREATE TABLE Voto (
  votoId INT AUTO_INCREMENT PRIMARY KEY,
  votacionId  INT NOT NULL,
  candidatoId INT NULL,
  normaId     INT NULL,
  opcion      ENUM('a_favor','en_contra') NULL,
  organizacionId INT,
  cargoId INT,
  distritoId  INT,
  FOREIGN KEY (votacionId) REFERENCES Votacion(votacionId)        ON DELETE CASCADE,
  FOREIGN KEY (candidatoId) REFERENCES Candidato(candidatoId)       ON DELETE CASCADE,
  FOREIGN KEY (normaId) REFERENCES Norma(normaId) ON DELETE CASCADE,
  FOREIGN KEY (organizacionId) REFERENCES Organizacion(organizacionId) ON DELETE SET NULL,
  FOREIGN KEY (cargoId) REFERENCES Cargo(cargoId) ON DELETE SET NULL,
  FOREIGN KEY (distritoId) REFERENCES Distrito(distritoId) ON DELETE SET NULL,
  CONSTRAINT chk_voto_un_solo_tipo CHECK (
    (candidatoId IS NOT NULL AND normaId IS NULL AND opcion IS NULL) OR
    (candidatoId IS NULL AND normaId IS NOT NULL AND opcion IS NOT NULL)
  )
);
CREATE TABLE VotacionCandidato (
  votacionId  INT NOT NULL,
  candidatoId INT NOT NULL,
  PRIMARY KEY (votacionId, candidatoId),
  FOREIGN KEY (votacionId)  REFERENCES Votacion(votacionId)  ON DELETE CASCADE,
  FOREIGN KEY (candidatoId) REFERENCES Candidato(candidatoId) ON DELETE CASCADE
);
CREATE TABLE VotoRegistro (
  dni VARCHAR(8) NOT NULL,
  votacionId INT NOT NULL,
  PRIMARY KEY (dni, votacionId),
  FOREIGN KEY (dni) REFERENCES Usuario(DNI) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (votacionId) REFERENCES Votacion(votacionId) ON DELETE CASCADE
);
CREATE TABLE SolicitudCambioContraseña (
  solicitudId INT AUTO_INCREMENT PRIMARY KEY,
  dni VARCHAR(8) NOT NULL,
  contraseñaNueva VARCHAR(50) NOT NULL,
  estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  fechaSolicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaResolucion DATETIME,
  FOREIGN KEY (dni) REFERENCES Usuario(DNI) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO Departamento (nombre) VALUES
  ('Lima');

INSERT INTO Provincia (nombre, departamentoId) VALUES
  ('Lima', 1);

INSERT INTO Distrito (nombre, provinciaId) VALUES
  ('SJL', 1);

INSERT INTO Usuario (DNI, nombre, apellidoP, apellidoM, rol, contraseña, distritoId) VALUES
  ('00000000', 'Cristian', 'Cox', 'Serrano', 'admin', 'admin12345', 1);