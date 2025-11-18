// routes/configuracion.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- Endpoint: GET /api/configuracion ---
// [PÚBLICO] Obtiene la configuración pública del sitio (ej. tel. de contacto)
router.get('/', async (req, res) => {
  try {
    // Buscamos la fila de configuración (siempre es id=1)
    const query = 'SELECT telefono_admin_whatsapp FROM Configuracion_Sistema WHERE id = 1';
    const config = await db.query(query);

    if (config.rows.length === 0) {
      // Esto pasará si olvidamos añadir los datos en pgAdmin
      return res.status(404).json({ msg: 'Configuración no encontrada' });
    }

    res.json(config.rows[0]); // Devuelve { telefono_admin_whatsapp: "..." }

  } catch (err) {
    console.error('Error en GET /configuracion:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;