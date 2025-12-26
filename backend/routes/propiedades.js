// backend/routes/propiedades.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const checkPlan = require('../middleware/checkPlan');
const jwt = require('jsonwebtoken'); 
const admin = require('../middleware/admin');
require('dotenv').config();

// --- Helper: Obtener ID de usuario si existe token ---
const getUserIdFromToken = (req) => {
  const token = req.header('x-auth-token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.usuario.id;
  } catch (err) { return null; }
};

// --- Endpoint: POST /api/propiedades (Crear Propiedad) ---
router.post('/', 
  [auth, checkPlan], // 1. Verifica login, 2. Verifica si pagó el plan
  async (req, res) => {

  // A. Verificación de Rol (Seguridad extra)
  if (req.usuario.rol !== 'AGENTE' && req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ msg: 'Permiso denegado. Solo agentes pueden publicar.' });
  }

  // B. Destructuring de datos
  const {
    titulo, descripcion, precio, tipo, habitaciones, banos,
    area_m2, latitud, longitud, direccion_texto,
    fotos, provincia, ciudad, operacion, amenidades 
  } = req.body;

  const usuarioId = req.usuario.id;

  // C. Validaciones
  if (!titulo || !precio || !latitud || !longitud || !provincia || !ciudad) {
    return res.status(400).json({ msg: 'Faltan campos obligatorios (Ubicación, Precio, Título).' });
  }

  // Validación condicional (Terrenos no tienen baños)
  const tiposSinHabitaciones = ['Terreno', 'Camping', 'Comercial'];
  if (!tiposSinHabitaciones.includes(tipo)) {
    if (!habitaciones || !banos) {
       return res.status(400).json({ msg: 'Para casas/departamentos, habitaciones y baños son obligatorios.' });
    }
  }

  if (!fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return res.status(400).json({ msg: 'Se requiere al menos una foto.' });
  }

  // D. INICIO DE TRANSACCIÓN (Todo o Nada)
  // Nota: Si db exporta el pool directo, usa: await db.connect();
  // Si exporta { pool, query }, usa: await db.pool.connect();
  // Voy a usar la forma genérica asumiendo que db es el pool:
  const client = await db.connect(); 

  try {
    await client.query('BEGIN'); // --- 🛑 INICIA TRANSACCIÓN

    // 1. Insertar la Propiedad
    const nuevaPropiedadQuery = `
      INSERT INTO Propiedades (
        usuario_id, propietario_id, titulo, descripcion, precio, tipo, 
        habitaciones, banos, area_m2, latitud, longitud, direccion_texto,
        provincia, ciudad, operacion, amenidades, fecha_publicacion
      )
      VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()) 
      RETURNING *;
    `;

    const values = [
      usuarioId, titulo, descripcion, precio, tipo,
      habitaciones || 0, banos || 0, area_m2, latitud, longitud, direccion_texto,
      provincia, ciudad, operacion || 'Venta', 
      amenidades || [] // Postgres guarda esto como ARRAY o JSONB
    ];
    
    const nuevaPropiedad = await client.query(nuevaPropiedadQuery, values);
    const propiedadId = nuevaPropiedad.rows[0].id;

    // 2. Insertar las Fotos (Loop)
    const fotosQuery = `INSERT INTO Fotos_Propiedad (propiedad_id, url_foto, orden) VALUES ($1, $2, $3)`;
    
    // Usamos Promise.all para que sea más rápido (en paralelo) en lugar de uno por uno
    const promesasFotos = fotos.map((foto, index) => {
        return client.query(fotosQuery, [propiedadId, foto, index]);
    });
    
    await Promise.all(promesasFotos);

    await client.query('COMMIT'); // --- ✅ CONFIRMA CAMBIOS
    
    res.status(201).json({ 
        msg: 'Propiedad publicada con éxito', 
        propiedad: { ...nuevaPropiedad.rows[0], fotos } 
    });

  } catch (err) {
    await client.query('ROLLBACK'); // --- ↩️ DESHACE TODO SI FALLA
    console.error("Error en transacción:", err);
    res.status(500).send('Error del servidor al guardar propiedad.');
  } finally {
    client.release(); // Libera la conexión del pool
  }
});

// --- Endpoint: GET /api/propiedades (Catálogo Público) ---
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { provincia, ciudad, tipo, precioMin, precioMax, operacion } = req.query;

    let baseQuery = `
      SELECT p.*, 
             u.logo_url as agente_logo_url,
             (SELECT f.url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id ORDER BY f.orden ASC LIMIT 1) as foto_principal,
             CASE WHEN fav.usuario_id IS NOT NULL THEN true ELSE false END as is_favorited
      FROM Propiedades p
      JOIN Usuarios u ON p.usuario_id = u.id -- Unimos con la tabla usuarios
      LEFT JOIN Favoritos fav ON p.id = fav.propiedad_id AND fav.usuario_id = $1
    `;
    
    const whereClauses = [];
    // --- ESTA ES LA LÍNEA NUEVA QUE HACE LA MAGIA ---
    // Solo mostramos propiedades si el dueño está APROBADO (o si es ADMIN)
    whereClauses.push(`(u.estado_agente = 'APROBADO' OR u.rol = 'ADMIN')`);
    // ------------------------------------------------
    
    const queryParams = [userId];
    let paramIndex = 2;

    if (operacion) { whereClauses.push(`p.operacion = $${paramIndex++}`); queryParams.push(operacion); }
    if (provincia && provincia !== 'Todas') { whereClauses.push(`p.provincia = $${paramIndex++}`); queryParams.push(provincia); }
    if (ciudad && ciudad !== 'Todas') { whereClauses.push(`p.ciudad = $${paramIndex++}`); queryParams.push(ciudad); }
    if (tipo && tipo !== 'Cualquiera') { whereClauses.push(`p.tipo = $${paramIndex++}`); queryParams.push(tipo); }
    if (precioMin) { whereClauses.push(`p.precio >= $${paramIndex++}`); queryParams.push(precioMin); }
    if (precioMax) { whereClauses.push(`p.precio <= $${paramIndex++}`); queryParams.push(precioMax); }

    if (whereClauses.length > 0) baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    
    baseQuery += ' ORDER BY p.fecha_publicacion DESC';

    const propiedades = await db.query(baseQuery, queryParams);
    res.json(propiedades.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/propiedades/me (Mis Propiedades - Agente) ---
router.get('/me', auth, async (req, res) => {
  try {
    const agenteId = req.usuario.id;
    const query = `
      SELECT p.*, 
        (SELECT f.url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id ORDER BY f.orden ASC LIMIT 1) as foto_principal
      FROM Propiedades p
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_publicacion DESC;
    `;
    const misPropiedades = await db.query(query, [agenteId]);
    res.json(misPropiedades.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/propiedades/:id (Detalle) ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromToken(req); 
    const propQuery = `
      SELECT p.*, u.nombre AS agente_nombre, u.telefono AS agente_telefono, u.logo_url AS agente_logo_url, u.email as agente_email,
      u.foto_perfil as agente_foto_perfil, u.biografia as agente_biografia,
      CASE WHEN fav.usuario_id IS NOT NULL THEN true ELSE false END as is_favorited
      FROM Propiedades p
      JOIN Usuarios u ON p.usuario_id = u.id
      LEFT JOIN Favoritos fav ON p.id = fav.propiedad_id AND fav.usuario_id = $2
      WHERE p.id = $1
    `;
    const propRes = await db.query(propQuery, [id, userId]);
    if (propRes.rows.length === 0) return res.status(404).json({ msg: 'Propiedad no encontrada' });
    
    const propiedad = propRes.rows[0];
    const fotosQuery = 'SELECT url_foto, orden FROM Fotos_Propiedad WHERE propiedad_id = $1 ORDER BY orden ASC';
    const fotosRes = await db.query(fotosQuery, [id]);
    
    res.json({ ...propiedad, fotos: fotosRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: PUT /api/propiedades/:id (Editar) ---
router.put('/:id', auth, async (req, res) => {
  try {
    const propiedadId = req.params.id;
    const usuario = req.usuario;
    
    // 1. Verificar propiedad y permisos
    const checkQuery = 'SELECT usuario_id FROM Propiedades WHERE id = $1';
    const propiedad = await db.query(checkQuery, [propiedadId]);
    
    if (propiedad.rows.length === 0) return res.status(404).json({ msg: 'No encontrada' });
    // Comparar UUIDs como strings
    if (propiedad.rows[0].usuario_id !== usuario.id && usuario.rol !== 'ADMIN') {
      return res.status(403).json({ msg: 'Permiso denegado' });
    }

    // 2. Extraer datos del body (AHORA SÍ ESTÁ AL PRINCIPIO)
    const { 
        titulo, descripcion, precio, tipo, habitaciones, banos, area_m2, 
        latitud, longitud, direccion_texto, provincia, ciudad, operacion 
    } = req.body;

    const updateQuery = `
      UPDATE Propiedades SET 
        titulo=$1, descripcion=$2, precio=$3, tipo=$4, habitaciones=$5, banos=$6, area_m2=$7, 
        latitud=$8, longitud=$9, direccion_texto=$10, provincia=$11, ciudad=$12, operacion=$13, fecha_actualizacion=NOW()
      WHERE id=$14 RETURNING *;
    `;
    const values = [
        titulo, descripcion, precio, tipo, habitaciones, banos, area_m2, 
        latitud, longitud, direccion_texto, provincia, ciudad, operacion, propiedadId
    ];
    
    const updated = await db.query(updateQuery, values);
    res.json({ msg: 'Actualizada', propiedad: updated.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar');
  }
});

// --- Endpoint: DELETE /api/propiedades/:id (Eliminar) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const propiedadId = req.params.id;
    const usuario = req.usuario;
    const query = 'SELECT usuario_id FROM Propiedades WHERE id = $1';
    const propiedad = await db.query(query, [propiedadId]);
    
    if (propiedad.rows.length === 0) return res.status(404).json({ msg: 'No encontrada' });
    if (propiedad.rows[0].usuario_id !== usuario.id && usuario.rol !== 'ADMIN') {
      return res.status(403).json({ msg: 'Permiso denegado' });
    }

    await db.query('DELETE FROM Propiedades WHERE id = $1', [propiedadId]);
    res.json({ msg: 'Eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// --- Endpoint: GET /admin/usuario/:id (Admin ve propiedades de otro) ---
router.get('/admin/usuario/:id', [auth, admin], async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
      (SELECT url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id LIMIT 1) as foto_principal
      FROM Propiedades p
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_publicacion DESC
    `;
    const props = await db.query(query, [req.params.id]);
    res.json(props.rows);
  } catch (err) {
    res.status(500).send('Error al cargar propiedades del agente');
  }
  
});

module.exports = router;