const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/notificaciones - Obtener las del usuario
router.get('/', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM Notificaciones WHERE usuario_id = $1 ORDER BY fecha_creacion DESC LIMIT 20';
        const result = await db.query(query, [req.usuario.id]);
        
        // Adaptamos la respuesta para que coincida con tu frontend (leido vs leida)
        const notificaciones = result.rows.map(n => ({
            ...n,
            leido: n.leida // Mapeamos la columna de DB 'leida' a 'leido' que usa tu React
        }));
        
        res.json(notificaciones);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener notificaciones');
    }
});

// PUT /api/notificaciones/marcar-leidas - Marcar todo como visto
router.put('/marcar-leidas', auth, async (req, res) => {
    try {
        await db.query('UPDATE Notificaciones SET leida = TRUE WHERE usuario_id = $1', [req.usuario.id]);
        res.json({ msg: 'Notificaciones actualizadas' });
    } catch (err) {
        res.status(500).send('Error al actualizar');
    }
});

module.exports = router;