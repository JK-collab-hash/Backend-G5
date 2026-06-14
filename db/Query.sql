-- Script Base de datos para el sistema de votación --

CREATE DATABASE bdprueba -- Creamos la base de datos con el nombre "bdprueba"
  CHARACTER SET utf8mb4 -- para soportar caracteres especiales y emojis
  COLLATE utf8mb4_unicode_ci; -- utf8mb4_unicode_ci es una colación que permite comparar cadenas de texto de manera insensible a mayúsculas, acentos y otros caracteres especiales, lo cual es ideal para aplicaciones en español.

USE bdprueba; -- Seleccionamos la base de datos para crear las tablas y realizar las operaciones posteriores.

-- Tablas para el sistema de votación --

-- TABLA: PartidoPolitico (representa los partidos políticos, con un campo para el nombre del partido) --
CREATE TABLE PartidoPolitico (
  partidoId INT AUTO_INCREMENT PRIMARY KEY, -- Registro único del partido político
  nombre VARCHAR(50) NOT NULL UNIQUE -- nombre del partido político (ejemplo: Partido de Ejemplo, Partido de la Gente, Partido Verde, Partido Azul)
);

-- TABLA: Distrito (representa los distritos de Lima Metropolitana, con un campo para el nombre del distrito) --
CREATE TABLE Distrito (
  distritoId INT AUTO_INCREMENT PRIMARY KEY, -- Registro único del distrito
  nombre VARCHAR(50) NOT NULL UNIQUE -- nombre del distrito (ejemplo: Lima, SJL, El Agustino, Los Olivos, Lurigancho, SMP, Villa El Salvador, Comas, San Juan de Lurigancho, San Martín de Porres)
);

-- TABLA: Cargo (representa los cargos que pueden ser votados, con un campo para indicar el tipo de cargo: nacional, distrital, institucional o de partido) --
CREATE TABLE Cargo (
  cargoId INT AUTO_INCREMENT PRIMARY KEY, -- Registro único del cargo
  nombre VARCHAR(50) NOT NULL UNIQUE,   -- nombre del cargo (ejemplo: Presidente, Alcalde, Decano CTP, Secretario General)
  tipo ENUM('nacional','distrital','institucional','partido') NOT NULL DEFAULT 'nacional' -- tipo de cargo para clasificar las votaciones (nacional, distrital, institucional o de partido)
);

-- TABLA: Usuario (representa a los votantes, con referencias a cargo, partido y distrito según corresponda) --
CREATE TABLE Usuario (
  DNI VARCHAR(8) PRIMARY KEY, -- DNI del usuario (ejemplo: 12345678)
  nombre VARCHAR(50) NOT NULL, -- nombre del usuario (ejemplo: Juan Perez, María López, Carlos García)
  rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario', -- rol del usuario para controlar acceso a funcionalidades (usuario o admin)
  contrasena VARCHAR(255), -- contraseña del usuario (puede ser NULL para usuarios que no necesitan acceso administrativo)
  cargoId INT, -- referencia al cargo del votante (puede ser NULL si el votante no ocupa un cargo específico o es un ciudadano común)
  partidoId INT, -- referencia al partido del votante (puede ser NULL si el votante es independiente o no pertenece a un partido específico)
  distritoId INT NOT NULL, -- referencia al distrito del votante (obligatorio para validar su derecho a votar en ciertas votaciones distritales)
  FOREIGN KEY (cargoId)    REFERENCES Cargo(cargoId)         ON DELETE SET NULL, -- si el cargo se elimina, se establece a NULL para los usuarios que lo tenían asignado
  FOREIGN KEY (partidoId)  REFERENCES PartidoPolitico(partidoId) ON DELETE SET NULL, -- si el partido se elimina, se establece a NULL para los usuarios que lo tenían asignado
  FOREIGN KEY (distritoId) REFERENCES Distrito(distritoId)      ON DELETE RESTRICT -- si el distrito se elimina, no se permite eliminarlo si hay usuarios asignados a ese distrito
);

-- TABLA: Candidato (representa a los candidatos que pueden ser votados, con referencias a partido y cargo según corresponda) --
CREATE TABLE Candidato (
  candidatoId INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL, -- nombre del candidato (ejemplo: Juan Perez, María López, Carlos García)
  partidoId INT, -- referencia al partido del candidato (puede ser NULL si el candidato es independiente)
  FOREIGN KEY (partidoId) REFERENCES PartidoPolitico(partidoId) ON DELETE SET NULL -- si el partido se elimina, se establece a NULL para los candidatos que lo tenían asignado
);

-- TABLA: Votacion (representa una elección o votación específica, con referencias a cargo, partido, distrito según corresponda) --
CREATE TABLE Votacion (
  votacionId INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL, -- título descriptivo de la votación (ejemplo: Elección Presidencial 2024, Elección Municipal Lima 2024, Elección Decano CTP 2024, Elección Secretario General Partido de Ejemplo 2024)
  tipo ENUM('nacional','distrital','institucional','partido','referendum') NOT NULL DEFAULT 'nacional', -- tipo de votación para clasificarla (nacional, distrital, institucional, de partido o referendum)
  cargoId    INT, -- para votaciones de cargo, se asigna el cargo correspondiente; para votaciones de partido o referendum, se deja NULL            
  partidoId  INT, -- para votaciones de partido, se asigna el partido correspondiente; para votaciones nacionales, distritales o institucionales, se deja NULL           
  distritoId INT, -- para votaciones distritales, se asigna el distrito correspondiente; para votaciones nacionales o institucionales, se deja NULL
  activa BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = votación activa, FALSE = desactivada manualmente o por fecha de fin
  fecha_ini DATETIME NOT NULL, -- fecha de inicio de la votación
  fecha_fin DATETIME NOT NULL, -- fecha de fin de la votación    
  FOREIGN KEY (cargoId)    REFERENCES Cargo(cargoId)           ON DELETE SET NULL, -- para votaciones de cargo, si el cargo se elimina, se establece a NULL para las votaciones que lo tenían asignado
  FOREIGN KEY (partidoId)  REFERENCES PartidoPolitico(partidoId) ON DELETE SET NULL, -- para votaciones de partido, si el partido se elimina, se establece a NULL para las votaciones que lo tenían asignado
  FOREIGN KEY (distritoId) REFERENCES Distrito(distritoId)        ON DELETE SET NULL -- para votaciones distritales, si el distrito se elimina, se establece a NULL para las votaciones que lo tenían asignado
);

-- TABLA: Voto (registro de votos emitidos, con referencias a votación, candidato, partido, cargo y distrito) --
CREATE TABLE Voto (
  votoId INT AUTO_INCREMENT PRIMARY KEY, -- Registro único del voto
  votacionId  INT NOT NULL, -- referencia a la votación en la que se emitió el voto
  candidatoId INT NOT NULL,  -- referencia al candidato por el que se votó
  partidoId   INT,  -- referencia al partido del candidato (puede ser NULL si el candidato es independiente)
  cargoId     INT, -- referencia al cargo por el que se votó (puede ser NULL para votaciones de partido o referendum)
  distritoId  INT, -- referencia al distrito del votante (puede ser NULL para votaciones nacionales o institucionales)
  FOREIGN KEY (votacionId)  REFERENCES Votacion(votacionId)         ON DELETE CASCADE, -- si la votación se elimina, se eliminan también los votos emitidos en esa votación
  FOREIGN KEY (candidatoId) REFERENCES Candidato(candidatoId)        ON DELETE CASCADE, -- si el candidato se elimina, se eliminan también los votos emitidos por ese candidato
  FOREIGN KEY (partidoId)   REFERENCES PartidoPolitico(partidoId)  ON DELETE SET NULL, -- si el partido se elimina, se establece a NULL para los votos emitidos por candidatos de ese partido
  FOREIGN KEY (cargoId)     REFERENCES Cargo(cargoId)            ON DELETE SET NULL, -- si el cargo se elimina, se establece a NULL para los votos emitidos por candidatos de ese cargo
  FOREIGN KEY (distritoId)  REFERENCES Distrito(distritoId)         ON DELETE SET NULL -- si el distrito se elimina, se establece a NULL para los votos emitidos por votantes de ese distrito
);

-- TABLA: VotacionCandidato (relación muchos a muchos entre Votacion y Candidato) --
CREATE TABLE VotacionCandidato (
  votacionId  INT NOT NULL,  -- referencia a la votación en la que participa el candidato
  candidatoId INT NOT NULL, -- referencia al candidato que participa en la votación
  PRIMARY KEY (votacionId, candidatoId), -- clave primaria compuesta para evitar duplicados y permitir la relación muchos a muchos entre votaciones y candidatos
  FOREIGN KEY (votacionId)  REFERENCES Votacion(votacionId)  ON DELETE CASCADE, -- si la votación se elimina, se eliminan también las relaciones con los candidatos que participaban en esa votación
  FOREIGN KEY (candidatoId) REFERENCES Candidato(candidatoId) ON DELETE CASCADE -- si el candidato se elimina, se eliminan también las relaciones con las votaciones en las que participaba ese candidato
);

-- TABLA: VotoRegistro (registro de qué usuarios han votado en qué votaciones para evitar votos múltiples) --
CREATE TABLE VotoRegistro (
  dni VARCHAR(8) NOT NULL, -- referencia al DNI del usuario que votó
  votacionId INT NOT NULL, -- referencia a la votación en la que se emitió el voto
  PRIMARY KEY (dni, votacionId), -- clave primaria compuesta para evitar que un mismo usuario vote más de una vez en la misma votación
  FOREIGN KEY (dni) REFERENCES Usuario(DNI) ON DELETE CASCADE, -- si el usuario se elimina, se eliminan también los registros de sus votos
  FOREIGN KEY (votacionId) REFERENCES Votacion(votacionId) ON DELETE CASCADE -- si la votación se elimina, se eliminan también los registros de votos asociados a esa votación
);

-- DATOS DE PRUEBA --
INSERT INTO PartidoPolitico (nombre) VALUES
  ('Partido de Ejemplo'), ('Partido de la Gente'), ('Partido Verde'), ('Partido Azul');

INSERT INTO Distrito (nombre) VALUES
  ('Lima'), ('SJL'), ('El Agustino'), ('Los Olivos'), ('Lurigancho'), ('SMP'), ('Villa El Salvador'), ('Comas'), ('San Martín de Porres');

INSERT INTO Cargo (nombre, tipo) VALUES
  ('Presidente', 'nacional'),
  ('Alcalde', 'distrital'),
  ('Decano CTP', 'institucional'),
  ('Secretario General', 'partido');

INSERT INTO Usuario (DNI, nombre, rol, contrasena, distritoId) VALUES
  ('00000000', 'Administrador', 'admin', 'admin123', 1);

INSERT INTO Usuario (DNI, nombre, distritoId) VALUES
('12345678', 'Juan Perez', 1);

INSERT INTO Usuario (DNI, nombre, distritoId) VALUES
('87654321', 'María López', 2);

INSERT INTO Usuario (DNI, nombre, distritoId) VALUES
('11223344', 'Carlos García', 3);

INSERT INTO Usuario (DNI, nombre, distritoId) VALUES
('44332211', 'Ana Torres', 4);
