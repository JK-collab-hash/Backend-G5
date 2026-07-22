const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bdprueba2',
  port: 3306,
  charset: 'utf8mb4'
});

module.exports = pool;