// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Necesitamos acceso a la BD para verificar estado
require('dotenv').config();

module.exports = async function(req, res, next) {
  // 1. Leer el token del header
  const token = req.header('x-auth-token');

  // 2. Verificar si no hay token
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso no válido' });
  }

  try {
    // 3. Verificar la firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- NUEVO: SEGURIDAD EN TIEMPO REAL ---
    // Consultamos el estado actual del usuario en la BD
    const query = 'SELECT id, nombre, email, rol, estado_agente FROM Usuarios WHERE id = $1';
    const result = await db.query(query, [decoded.usuario.id]);
    
    const usuarioActual = result.rows[0];

    if (!usuarioActual) {
        return res.status(401).json({ msg: 'Usuario no encontrado.' });
    }

    // SI ESTÁ SUSPENDIDO, LE BLOQUEAMOS EL PASO AUNQUE TENGA TOKEN
    if (usuarioActual.estado_agente === 'SUSPENDIDO') {
        return res.status(403).json({ 
            msg: 'Tu cuenta ha sido SUSPENDIDA. Contacta al administrador.' 
        });
    }
    // ----------------------------------------

    // Inyectamos el usuario fresco en la request
    req.usuario = usuarioActual;
    next();

  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token no válido' });
  }
};