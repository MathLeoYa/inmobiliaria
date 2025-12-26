// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validarCedula = require('../utils/validadorCedula');

// Helper para notificaciones
const crearNotificacion = async (usuarioId, mensaje, tipo = 'info', enlace = null) => {
    try {
        await db.query(
            'INSERT INTO Notificaciones (usuario_id, mensaje, tipo, enlace) VALUES ($1, $2, $3, $4)',
            [usuarioId, mensaje, tipo, enlace]
        );
    } catch (e) { console.error("Error creando notificación:", e); }
};
router.get('/me', auth, async (req, res) => {
  try {
    // Buscamos al usuario por el ID que viene del token (req.usuario.id)
    const query = 'SELECT * FROM Usuarios WHERE id = $1';
    const result = await db.query(query, [req.usuario.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    
    // Por seguridad, eliminamos la contraseña antes de enviarla al frontend
    delete usuario.password_hash;

    res.json(usuario);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: PUT /api/usuarios/me (Actualizar perfil propio) ---
router.put('/me', auth, async (req, res) => {
  const usuarioId = req.usuario.id;
  const { nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia } = req.body; 

  try {
    const updateQuery = `
      UPDATE Usuarios
      SET nombre = $1, telefono = $2, foto_perfil = $3, biografia = $4,
          facebook = $5, instagram = $6, sitio_web = $7, ciudad = $8, provincia = $9,
          fecha_actualizacion = NOW()
      WHERE id = $10 RETURNING *;
    `;
    const values = [nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia, usuarioId];
    const usuarioActualizado = await db.query(updateQuery, values);
    delete usuarioActualizado.rows[0].password_hash; 

    res.json({ msg: 'Perfil actualizado', usuario: usuarioActualizado.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: POST /api/usuarios/me/solicitar-agente ---
router.post('/me/solicitar-agente', auth, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { telefono, biografia, cedula } = req.body;

    if (!telefono || !biografia || !cedula) return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    if (!validarCedula(cedula)) return res.status(400).json({ msg: 'El número de cédula no es válido.' });

    const cedulaCheck = await db.query('SELECT id FROM Usuarios WHERE cedula = $1 AND id != $2', [cedula, usuarioId]);
    if (cedulaCheck.rows.length > 0) return res.status(400).json({ msg: 'Esta Cédula ya está registrada.' });

    const userQuery = 'SELECT rol, estado_agente FROM Usuarios WHERE id = $1';
    const usuario = await db.query(userQuery, [usuarioId]);
    
    if (usuario.rows[0].rol === 'AGENTE' || usuario.rows[0].rol === 'ADMIN') return res.status(400).json({ msg: 'Ya eres Agente o Admin' });
    if (usuario.rows[0].estado_agente === 'PENDIENTE') return res.status(400).json({ msg: 'Tu solicitud ya está PENDIENTE' });

    const updateQuery = `
      UPDATE Usuarios
      SET estado_agente = 'PENDIENTE', telefono = $1, biografia = $2, cedula = $3, fecha_actualizacion = NOW()
      WHERE id = $4 RETURNING estado_agente;
    `;
    const updatedUser = await db.query(updateQuery, [telefono, biografia, cedula, usuarioId]);

    // Notificar a Admins
    const admins = await db.query("SELECT id FROM Usuarios WHERE rol = 'ADMIN'");
    for (const adminUser of admins.rows) {
        await crearNotificacion(adminUser.id, `Nueva solicitud de Agente recibida.`, 'info', '/admin');
    }

    res.json({ msg: 'Solicitud enviada correctamente.', estado: updatedUser.rows[0].estado_agente });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ msg: 'Esta Cédula ya está registrada.' });
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/usuarios/solicitudes-agente (SOLO PENDIENTES/PROCESADOS) ---
router.get('/solicitudes-agente', [auth, admin], async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, email, telefono, biografia, foto_perfil, estado_agente, fecha_creacion 
      FROM Usuarios WHERE estado_agente != 'NO_SOLICITADO' ORDER BY fecha_creacion DESC;
    `;
    const solicitudes = await db.query(query);
    res.json(solicitudes.rows);
  } catch (err) { res.status(500).send('Error del servidor'); }
});

// --- Endpoint: PUT Aprobar Agente ---
router.put('/:id/aprobar-agente', [auth, admin], async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const updateQuery = `
      UPDATE Usuarios SET rol = 'AGENTE', estado_agente = 'APROBADO', fecha_actualizacion = NOW()
      WHERE id = $1 RETURNING id, nombre, email, rol, estado_agente;
    `;
    const usuarioAprobado = await db.query(updateQuery, [usuarioId]);
    await crearNotificacion(usuarioId, '¡Felicidades! Tu solicitud ha sido APROBADA.', 'success', '/publicar');
    res.json({ msg: 'Usuario aprobado', usuario: usuarioAprobado.rows[0] });
  } catch (err) { res.status(500).send('Error del servidor'); }
});

// --- Endpoint: PUT Rechazar Agente ---
router.put('/:id/rechazar-agente', [auth, admin], async (req, res) => {
  try {
    const usuarioId = req.params.id;
    await db.query("UPDATE Usuarios SET estado_agente = 'RECHAZADO' WHERE id = $1", [usuarioId]);
    await crearNotificacion(usuarioId, 'Tu solicitud ha sido rechazada.', 'error', '/solicitar-agente');
    res.json({ msg: 'Solicitud rechazada' });
  } catch (err) { res.status(500).send('Error del servidor'); }
});

// =================================================================================
// 🚨 AQUÍ ESTABAN FALTANDO LAS RUTAS PARA "GESTIÓN AGENTES" (CRUD)
// =================================================================================

// --- GET /api/usuarios/lista-agentes (Para la tabla de Gestión) ---
router.get('/lista-agentes', [auth, admin], async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, email, telefono, estado_agente, foto_perfil,
      -- Asegúrate que aquí diga 'usuario_id' que es la que acabamos de llenar
      (SELECT COUNT(*) FROM Propiedades WHERE usuario_id = Usuarios.id) as total_propiedades
      FROM Usuarios 
      WHERE rol = 'AGENTE' OR estado_agente IN ('APROBADO', 'SUSPENDIDO')
      ORDER BY nombre ASC;
    `;
    const agentes = await db.query(query);
    res.json(agentes.rows);
  } catch (err) {
    // ...
  }
});

// --- PUT Suspender/Reactivar ---
router.put('/:id/cambiar-estado', [auth, admin], async (req, res) => {
  const { nuevoEstado, mensajeMotivo } = req.body; 
  const usuarioId = req.params.id;

  try {
    // 1. Actualizar el estado en la base de datos
    await db.query('UPDATE Usuarios SET estado_agente = $1 WHERE id = $2', [nuevoEstado, usuarioId]);

    // 2. Crear Notificación Automática
    let mensajeNotificacion = '';
    let tipoNotificacion = 'info';
    let link = '/perfil';

    if (nuevoEstado === 'SUSPENDIDO') {
        // Si se suspende, usamos el motivo que escribió el admin
        mensajeNotificacion = `⚠️ Tu cuenta ha sido SUSPENDIDA. Motivo: ${mensajeMotivo || 'Incumplimiento de normas.'}`;
        tipoNotificacion = 'error'; // Rojo
        link = '/solicitar-agente'; // Opcional: A donde quieras que vaya
    } else if (nuevoEstado === 'APROBADO') {
        // Si se reactiva
        mensajeNotificacion = `✅ Tu cuenta ha sido REACTIVADA. Ya puedes publicar propiedades nuevamente.`;
        tipoNotificacion = 'success'; // Verde
        link = '/mis-propiedades';
    }

    // Usamos el helper que ya tienes definido arriba en este archivo
    if (mensajeNotificacion) {
        await crearNotificacion(usuarioId, mensajeNotificacion, tipoNotificacion, link);
    }

    res.json({ msg: `Estado actualizado a ${nuevoEstado} y notificación enviada.` });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cambiar estado');
  }
});

// --- DELETE Eliminar Agente ---
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    await db.query('DELETE FROM Usuarios WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Agente eliminado' });
  } catch (err) { res.status(500).send('Error al eliminar'); }
});

module.exports = router;