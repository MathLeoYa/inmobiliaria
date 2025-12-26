const db = require('../config/db');

module.exports = async function(req, res, next) {
    try {
        const usuarioId = req.usuario.id;

        // 1. Obtener plan activo
        const query = `
            SELECT s.*, p.max_propiedades
            FROM suscripciones s
            JOIN planes p ON s.plan_id = p.id
            WHERE s.usuario_id = $1 AND s.estado = 'ACTIVA' AND s.fecha_fin > NOW()
        `;
        const subRes = await db.query(query, [usuarioId]);

        // Si no hay plan o venció
        if (subRes.rows.length === 0) {
            // Opcional: Permitir acción si es Admin
            if (req.usuario.rol === 'ADMIN') return next();
            
            return res.status(403).json({ 
                msg: '⛔ Tu plan ha vencido o no tienes uno activo. Por favor contacta al administrador para renovar.' 
            });
        }

        const planActual = subRes.rows[0];

        // 2. Verificar límites (Solo si intenta crear propiedad)
        if (req.method === 'POST' && req.originalUrl.includes('/propiedades')) {
            const countQuery = 'SELECT COUNT(*) FROM propiedades WHERE usuario_id = $1';
            const countRes = await db.query(countQuery, [usuarioId]);
            const propiedadesActuales = parseInt(countRes.rows[0].count);

            if (propiedadesActuales >= planActual.max_propiedades) {
                return res.status(403).json({ 
                    msg: `⛔ Has alcanzado el límite de tu plan (${planActual.max_propiedades} propiedades). ¡Mejora tu plan para publicar más!` 
                });
            }
        }

        // Todo bien, pase
        next();

    } catch (err) {
        console.error(err);
        res.status(500).send('Error verificando plan');
    }
};