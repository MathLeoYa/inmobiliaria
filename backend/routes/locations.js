// routes/locations.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- Endpoint: GET /api/locations/provincias ---
router.get('/provincias', async (req, res) => {
  try {
    const provincias = await db.query('SELECT * FROM Provincias ORDER BY nombre ASC');
    res.json(provincias.rows);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/locations/cantones/:provinciaId ---
router.get('/cantones/:provinciaId', async (req, res) => {
  try {
    const { provinciaId } = req.params;
    const cantones = await db.query(
      'SELECT * FROM Cantones WHERE provincia_id = $1 ORDER BY nombre ASC',
      [provinciaId]
    );
    res.json(cantones.rows);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;