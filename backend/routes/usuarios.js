// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validarCedula = require('../utils/validadorCedula'); // <-- IMPORTAR
// --- Endpoint: PUT /api/usuarios/me ---
// [PROTEGIDO] El usuario actualiza su propio perfil
router.put('/me', auth, async (req, res) => {
  const usuarioId = req.usuario.id;
  const { nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia } = req.body; 

  try {
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
      RETURNING *;
    `;
    
    const values = [nombre, telefono, foto_perfil, biografia, facebook, instagram, sitio_web, ciudad, provincia, usuarioId];
    const usuarioActualizado = await db.query(updateQuery, values);

    delete usuarioActualizado.rows[0].password_hash; // Seguridad

    res.json({
      msg: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: POST /api/usuarios/me/solicitar-agente ---
// [PROTEGIDO] Solicitud con FORMULARIO (Teléfono y Motivación)
router.post('/me/solicitar-agente', auth, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { telefono, biografia, cedula } = req.body;

    // 1. Validaciones de campos vacíos
    if (!telefono || !biografia || !cedula) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }

    // 2. --- NUEVA VALIDACIÓN: ALGORITMO ECUATORIANO ---
    if (!validarCedula(cedula)) {
        return res.status(400).json({ msg: 'El número de cédula no es válido.' });
    }

    // 3. Verificar si la CÉDULA ya existe en la BD (Unicidad)
    const cedulaCheck = await db.query('SELECT id FROM Usuarios WHERE cedula = $1 AND id != $2', [cedula, usuarioId]);
    if (cedulaCheck.rows.length > 0) {
        return res.status(400).json({ msg: 'Esta Cédula ya está registrada en otra cuenta.' });
    }

    // ... (Resto del código: verificar estado usuario, updateQuery, etc. queda IGUAL) ...
    
    // (Aquí sigue el código que ya tenías...)
    const userQuery = 'SELECT rol, estado_agente FROM Usuarios WHERE id = $1';
    const usuario = await db.query(userQuery, [usuarioId]);
    if (usuario.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado' });
    
    const { rol, estado_agente } = usuario.rows[0];

    if (rol === 'AGENTE' || rol === 'ADMIN') {
      return res.status(400).json({ msg: 'Ya eres Agente o Administrador' });
    }
    if (estado_agente === 'PENDIENTE') {
      return res.status(400).json({ msg: 'Tu solicitud ya está PENDIENTE' });
    }

    // 4. Actualizamos datos
    const updateQuery = `
      UPDATE Usuarios
      SET 
        estado_agente = 'PENDIENTE', 
        telefono = $1, 
        biografia = $2,
        cedula = $3,
        fecha_actualizacion = NOW()
      WHERE id = $4
      RETURNING estado_agente;
    `;
    
    const updatedUser = await db.query(updateQuery, [telefono, biografia, cedula, usuarioId]);

    res.json({
      msg: 'Solicitud enviada correctamente.',
      estado: updatedUser.rows[0].estado_agente,
    });

  } catch (err) {
    console.error('Error en solicitar-agente:', err.message);
    // Manejo de error de base de datos por duplicado (backup safety)
    if (err.code === '23505') { 
        return res.status(400).json({ msg: 'Esta Cédula ya está registrada.' });
    }
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/usuarios/solicitudes-agente ---
// [PROTEGIDO - SOLO ADMIN] Ver todas las solicitudes
router.get('/solicitudes-agente', [auth, admin], async (req, res) => {
  try {
    const query = `
      SELECT id, nombre, email, telefono, biografia, foto_perfil, estado_agente, fecha_creacion 
      FROM Usuarios 
      WHERE estado_agente != 'NO_SOLICITADO'
      ORDER BY fecha_creacion DESC;
    `;
    const solicitudes = await db.query(query);
    res.json(solicitudes.rows);
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: PUT /api/usuarios/:id/aprobar-agente ---
// [PROTEGIDO - SOLO ADMIN] Aprobar
router.put('/:id/aprobar-agente', [auth, admin], async (req, res) => {
  try {
    const usuarioId = req.params.id;
    // Verificamos que esté pendiente (opcional, pero recomendado)
    const userCheck = await db.query("SELECT estado_agente FROM Usuarios WHERE id = $1", [usuarioId]);
    if (userCheck.rows.length === 0) return res.status(404).json({msg: "Usuario no encontrado"});

    const updateQuery = `
      UPDATE Usuarios
      SET rol = 'AGENTE', estado_agente = 'APROBADO', fecha_actualizacion = NOW()
      WHERE id = $1
      RETURNING id, nombre, email, rol, estado_agente;
    `;
    const usuarioAprobado = await db.query(updateQuery, [usuarioId]);
    res.json({ msg: 'Usuario aprobado como AGENTE', usuario: usuarioAprobado.rows[0] });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: PUT /api/usuarios/:id/rechazar-agente ---
// [PROTEGIDO - SOLO ADMIN] Rechazar
router.put('/:id/rechazar-agente', [auth, admin], async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const updateQuery = `
      UPDATE Usuarios SET estado_agente = 'RECHAZADO' WHERE id = $1
    `;
    await db.query(updateQuery, [usuarioId]);
    res.json({ msg: 'Solicitud rechazada correctamente' });
  } catch (err) {
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;