const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Helper para notificaciones (Reutilizamos la lógica)
const crearNotificacion = async (usuarioId, mensaje, tipo, enlace) => {
    try {
        await db.query('INSERT INTO Notificaciones (usuario_id, mensaje, tipo, enlace) VALUES ($1, $2, $3, $4)', 
        [usuarioId, mensaje, tipo, enlace]);
    } catch (e) { console.error(e); }
};

// 1. ASIGNAR PLAN MANUALMENTE (Solo Admin)
router.post('/asignar', [auth, admin], async (req, res) => {
    const { usuarioId, planId, observaciones } = req.body;

    try {
        // A. Obtener detalles del plan (días de duración)
        const planRes = await db.query('SELECT * FROM planes WHERE id = $1', [planId]);
        if (planRes.rows.length === 0) return res.status(404).json({ msg: 'Plan no encontrado' });
        const plan = planRes.rows[0];

        // B. Calcular fechas
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaInicio.getDate() + plan.duracion_dias); // Sumar días del plan

        // C. Desactivar cualquier suscripción activa anterior (para evitar conflictos)
        await db.query(`UPDATE suscripciones SET estado = 'CANCELADA' WHERE usuario_id = $1 AND estado = 'ACTIVA'`, [usuarioId]);

        // D. Crear la nueva suscripción
        const nuevaSub = await db.query(`
            INSERT INTO suscripciones (usuario_id, plan_id, fecha_inicio, fecha_fin, estado, pago_referencia)
            VALUES ($1, $2, $3, $4, 'ACTIVA', $5)
            RETURNING *
        `, [usuarioId, planId, fechaInicio, fechaFin, observaciones || 'Pago Manual']);

        // E. Notificar al Agente
        const mensaje = `🎉 ¡Tu plan ha sido actualizado a ${plan.nombre}! Disfruta de ${plan.max_propiedades} propiedades y mayor visibilidad por ${plan.duracion_dias} días.`;
        await crearNotificacion(usuarioId, mensaje, 'success', '/mi-plan');

        res.json({ msg: 'Plan asignado correctamente', suscripcion: nuevaSub.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al asignar plan');
    }
});

// 2. VER MI PLAN ACTUAL (Para el Agente)
router.get('/mi-plan', auth, async (req, res) => {
    try {
        // Buscar suscripción activa y que la fecha no haya vencido
        const query = `
            SELECT s.*, p.nombre as nombre_plan, p.max_propiedades, p.max_fotos
            FROM suscripciones s
            JOIN planes p ON s.plan_id = p.id
            WHERE s.usuario_id = $1 AND s.estado = 'ACTIVA' AND s.fecha_fin > NOW()
            ORDER BY s.fecha_inicio DESC LIMIT 1
        `;
        const result = await db.query(query, [req.usuario.id]);
        
        if (result.rows.length === 0) {
            // Si no tiene plan activo, devolver null o un objeto "Plan Gratuito Expirado"
            return res.json({ estado: 'SIN_PLAN', msg: 'No tienes un plan activo o ha vencido.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send('Error al obtener plan');
    }
});

module.exports = router;