// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Creamos un "pool" de conexiones
// Esto es más eficiente que crear una conexión por cada consulta
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exportamos la habilidad de hacer consultas
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool, 
};