// routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Nuestro conector de BD
const auth = require('../middleware/auth'); // ¡Nuestro guardián!
const admin = require('../middleware/admin');
// --- Endpoint: POST /api/usuarios/me/solicitar-agente ---
// [PROTEGIDO] Un CLIENTE solicita convertirse en AGENTE.
router.post('/me/solicitar-agente', auth, async (req, res) => {
  try {
    // 1. Obtenemos el ID del usuario (del token)
    const usuarioId = req.usuario.id;

    // 2. Buscamos el estado actual del usuario
    const userQuery = 'SELECT rol, estado_agente FROM Usuarios WHERE id = $1';
    const usuario = await db.query(userQuery, [usuarioId]);

    if (usuario.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const { rol, estado_agente } = usuario.rows[0];

    // 3. Validaciones de estado
    if (rol === 'AGENTE' || rol === 'ADMIN') {
      return res.status(400).json({ msg: 'Ya eres Agente o Administrador' });
    }
    if (estado_agente === 'PENDIENTE') {
      return res.status(400).json({ msg: 'Tu solicitud ya está PENDIENTE de aprobación' });
    }
    if (estado_agente === 'RECHAZADO') {
      // (Opcional: podrías permitir que vuelvan a aplicar, pero por ahora seremos estrictos)
      return res.status(400).json({ msg: 'Tu solicitud fue rechazada previamente' });
    }

    // 4. ¡Todo en orden! Actualizamos su estado a PENDIENTE
    const updateQuery = `
      UPDATE Usuarios
      SET estado_agente = 'PENDIENTE', fecha_actualizacion = NOW()
      WHERE id = $1
      RETURNING estado_agente;
    `;
    const updatedUser = await db.query(updateQuery, [usuarioId]);

    res.json({
      msg: 'Solicitud para ser Agente enviada. Está PENDIENTE de aprobación.',
      estado: updatedUser.rows[0].estado_agente,
    });

  } catch (err) {
    console.error('Error en POST /me/solicitar-agente:', err.message);
    res.status(500).send('Error del servidor');
  }
});

// (Aquí pondremos las rutas del ADMIN para aprobar)

router.put('/me', auth, async (req, res) => {
  const usuarioId = req.usuario.id;
  // 1. AÑADIMOS LOS NUEVOS CAMPOS AL DESTRUCTURING
  const { nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia } = req.body; 

  try {
    // 2. ACTUALIZAMOS LA CONSULTA SQL
    const updateQuery = `
      UPDATE Usuarios
      SET 
        nombre = $1, 
        telefono = $2, 
        foto_perfil = $3, 
        biografia = $4,
        facebook = $5,
        instagram = $6,
        sitio_web = $7,
        ciudad = $8,
        provincia = $9,
        fecha_actualizacion = NOW()
      WHERE id = $10
      RETURNING *; -- Retorna todo para no escribir columna por columna
    `;
    
    const values = [nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia, usuarioId];
    
    const usuarioActualizado = await db.query(updateQuery, values);

    // Eliminamos el password del objeto antes de enviarlo (por seguridad)
    delete usuarioActualizado.rows[0].password_hash;

    res.json({
      msg: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

router.get('/solicitudes-pendientes', [auth, admin], async (req, res) => {
  try {
    // 1. Buscamos en la BD solo los usuarios PENDIENTES
    //    Seleccionamos solo los datos que el admin necesita ver.
    const query = `
      SELECT id, nombre, email, fecha_creacion 
      FROM Usuarios 
      WHERE estado_agente = 'PENDIENTE' 
      ORDER BY fecha_creacion ASC;
    `;
    
    const solicitudes = await db.query(query);

    // 2. Respondemos con la lista
    res.json(solicitudes.rows);

  } catch (err) {
    console.error('Error en GET /solicitudes-pendientes:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;