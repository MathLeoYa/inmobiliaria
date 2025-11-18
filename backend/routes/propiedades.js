// routes/propiedades.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken'); // <-- NECESARIO PARA LEER TOKEN EN RUTAS PÚBLICAS
require('dotenv').config();

// --- Función Helper: Obtener ID de usuario si existe token ---
const getUserIdFromToken = (req) => {
  const token = req.header('x-auth-token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.usuario.id;
  } catch (err) {
    return null;
  }
};

// --- Endpoint: POST /api/propiedades --- (Sin cambios)
router.post('/', auth, async (req, res) => {
  if (req.usuario.rol !== 'AGENTE' && req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ msg: 'Permiso denegado.' });
  }

  const {
    titulo, descripcion, precio, tipo, habitaciones, banos,
    area_m2, latitud, longitud, direccion_texto,
    fotos, provincia, ciudad, operacion
  } = req.body;

  const propietarioId = req.usuario.id;

  // Validación simple
  if (!titulo || !precio || !latitud || !longitud || !provincia || !ciudad) {
    return res.status(400).json({ 
      msg: 'Faltan campos obligatorios (título, precio, ubicación).' 
    });
  }
  // 2. Validación Condicional (Solo para estructuras habitables)
  const tiposSinHabitaciones = ['Terreno', 'Camping'];
  
  if (!tiposSinHabitaciones.includes(tipo)) {
    // Si NO es terreno ni camping, exigimos habitaciones y baños
    // (Nota: area_m2 siempre es útil, incluso en terrenos)
    if (!habitaciones || !banos) {
       return res.status(400).json({ msg: 'Para este tipo de propiedad, habitaciones y baños son obligatorios.' });
    }
  }

  if (!fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return res.status(400).json({ msg: 'Se requiere al menos una foto' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const nuevaPropiedadQuery = `
      INSERT INTO Propiedades (
        propietario_id, titulo, descripcion, precio, tipo, 
        habitaciones, banos, area_m2, latitud, longitud, direccion_texto,
        provincia, ciudad, operacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    const values = [
      propietarioId, titulo, descripcion, precio, tipo,
      habitaciones, banos, area_m2, latitud, longitud, direccion_texto,
      provincia, ciudad, operacion || 'Venta' // Por defecto Venta si no envían nada
    ];
    
    const nuevaPropiedad = await client.query(nuevaPropiedadQuery, values);
    const propiedadCreada = nuevaPropiedad.rows[0];
    const propiedadId = propiedadCreada.id;

    const fotosQuery = `INSERT INTO Fotos_Propiedad (propiedad_id, url_foto, orden) VALUES ($1, $2, $3)`;
    for (let i = 0; i < fotos.length; i++) {
      await client.query(fotosQuery, [propiedadId, fotos[i], i]);
    }

    await client.query('COMMIT');
    res.status(201).json({ msg: 'Propiedad publicada', propiedad: { ...propiedadCreada, fotos } });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Error del servidor');
  } finally {
    client.release();
  }
});

// --- GET (Catálogo) - AHORA FILTRA POR OPERACIÓN ---
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    // Recibimos 'operacion' del frontend
    const { provincia, ciudad, tipo, precioMin, precioMax, operacion } = req.query;

    let baseQuery = `
      SELECT p.*, 
             u.logo_url as agente_logo_url,
             (SELECT f.url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id ORDER BY f.orden ASC LIMIT 1) as foto_principal,
             CASE WHEN fav.usuario_id IS NOT NULL THEN true ELSE false END as is_favorited
      FROM Propiedades p
      JOIN Usuarios u ON p.propietario_id = u.id
      LEFT JOIN Favoritos fav ON p.id = fav.propiedad_id AND fav.usuario_id = $1
    `;
    
    const whereClauses = [];
    const queryParams = [userId];
    let paramIndex = 2;

    // Filtro de Operación (Venta vs Arriendo)
    if (operacion) {
      whereClauses.push(`p.operacion = $${paramIndex++}`);
      queryParams.push(operacion);
    }

    if (provincia && provincia !== 'Todas') {
      whereClauses.push(`p.provincia = $${paramIndex++}`);
      queryParams.push(provincia);
    }
    if (ciudad && ciudad !== 'Todas') {
      whereClauses.push(`p.ciudad = $${paramIndex++}`);
      queryParams.push(ciudad);
    }
    if (tipo && tipo !== 'Cualquiera') {
      whereClauses.push(`p.tipo = $${paramIndex++}`);
      queryParams.push(tipo);
    }
    if (precioMin) {
      whereClauses.push(`p.precio >= $${paramIndex++}`);
      queryParams.push(precioMin);
    }
    if (precioMax) {
      whereClauses.push(`p.precio <= $${paramIndex++}`);
      queryParams.push(precioMax);
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    baseQuery += ' ORDER BY p.fecha_publicacion DESC';

    const propiedades = await db.query(baseQuery, queryParams);
    res.json(propiedades.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});
// --- Endpoint: GET /api/propiedades --- (ACTUALIZADO: Sync Favoritos)
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req); // 1. Intentamos obtener el usuario
    const { provincia, ciudad, tipo, precioMin, precioMax } = req.query;

    // 2. Consulta SQL con CASE para ver si es favorito
    let baseQuery = `
      SELECT p.*, 
             u.logo_url as agente_logo_url,
             (SELECT f.url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id ORDER BY f.orden ASC LIMIT 1) as foto_principal,
             CASE 
               WHEN fav.usuario_id IS NOT NULL THEN true 
               ELSE false 
             END as is_favorited
      FROM Propiedades p
      JOIN Usuarios u ON p.propietario_id = u.id
      LEFT JOIN Favoritos fav ON p.id = fav.propiedad_id AND fav.usuario_id = $1
    `;
    
    const whereClauses = [];
    const queryParams = [userId]; // El parámetro $1 es el userId (puede ser null)
    let paramIndex = 2; // Empezamos los filtros desde $2

    if (provincia && provincia !== 'Todas') {
      whereClauses.push(`p.provincia = $${paramIndex++}`);
      queryParams.push(provincia);
    }
    if (ciudad && ciudad !== 'Todas') {
      whereClauses.push(`p.ciudad = $${paramIndex++}`);
      queryParams.push(ciudad);
    }
    if (tipo && tipo !== 'Cualquiera') {
      whereClauses.push(`p.tipo = $${paramIndex++}`);
      queryParams.push(tipo);
    }
    if (precioMin) {
      whereClauses.push(`p.precio >= $${paramIndex++}`);
      queryParams.push(precioMin);
    }
    if (precioMax) {
      whereClauses.push(`p.precio <= $${paramIndex++}`);
      queryParams.push(precioMax);
    }

    if (whereClauses.length > 0) {
      baseQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    baseQuery += ' ORDER BY p.fecha_publicacion DESC';

    const propiedades = await db.query(baseQuery, queryParams);
    res.json(propiedades.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});


// --- GET /me (Sin cambios, solo añadir auth) ---
router.get('/me', auth, async (req, res) => { /* ... código igual al anterior ... */ 
    try {
    const agenteId = req.usuario.id;
    const query = `
      SELECT p.*, 
        (SELECT f.url_foto FROM Fotos_Propiedad f WHERE f.propiedad_id = p.id ORDER BY f.orden ASC LIMIT 1) as foto_principal
      FROM Propiedades p
      WHERE p.propietario_id = $1
      ORDER BY p.fecha_publicacion DESC;
    `;
    const misPropiedades = await db.query(query, [agenteId]);
    res.json(misPropiedades.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// --- Endpoint: GET /api/propiedades/:id --- (ACTUALIZADO: Sync Favoritos)
router.get('/:id', async (req, res) => { /* ... código igual al anterior ... */ 
    try {
    const { id } = req.params;
    const userId = getUserIdFromToken(req); 
    const propQuery = `
      SELECT p.*, u.nombre AS agente_nombre, u.telefono AS agente_telefono, u.logo_url AS agente_logo_url,
      CASE WHEN fav.usuario_id IS NOT NULL THEN true ELSE false END as is_favorited
      FROM Propiedades p
      JOIN Usuarios u ON p.propietario_id = u.id
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

// --- Endpoint: PUT /api/propiedades/:id --- (Sin cambios)
router.put('/:id', auth, async (req, res) => {
    try {
    const propiedadId = req.params.id;
    const usuario = req.usuario;
    const query = 'SELECT propietario_id FROM Propiedades WHERE id = $1';
    const propiedad = await db.query(query, [propiedadId]);
    if (propiedad.rows.length === 0) return res.status(404).json({ msg: 'No encontrada' });
    if (propiedad.rows[0].propietario_id !== usuario.id && usuario.rol !== 'ADMIN') {
      return res.status(403).json({ msg: 'Permiso denegado' });
    }
    // 2. Validación Condicional (Solo para estructuras habitables)
  const tiposSinHabitaciones = ['Terreno', 'Camping'];
  
  if (!tiposSinHabitaciones.includes(tipo)) {
    // Si NO es terreno ni camping, exigimos habitaciones y baños
    // (Nota: area_m2 siempre es útil, incluso en terrenos)
    if (!habitaciones || !banos) {
       return res.status(400).json({ msg: 'Para este tipo de propiedad, habitaciones y baños son obligatorios.' });
    }
  }

  if (!fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return res.status(400).json({ msg: 'Se requiere al menos una foto' });
  }

    // Recibimos operacion
    const { titulo, descripcion, precio, tipo, habitaciones, banos, area_m2, latitud, longitud, direccion_texto, provincia, ciudad, operacion } = req.body;

    const updateQuery = `
      UPDATE Propiedades SET 
        titulo=$1, descripcion=$2, precio=$3, tipo=$4, habitaciones=$5, banos=$6, area_m2=$7, 
        latitud=$8, longitud=$9, direccion_texto=$10, provincia=$11, ciudad=$12, operacion=$13, fecha_actualizacion=NOW()
      WHERE id=$14 RETURNING *;
    `;
    const values = [titulo, descripcion, precio, tipo, habitaciones, banos, area_m2, latitud, longitud, direccion_texto, provincia, ciudad, operacion, propiedadId];
    const updated = await db.query(updateQuery, values);
    res.json({ msg: 'Actualizada', propiedad: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// --- Endpoint: DELETE /api/propiedades/:id --- (Sin cambios)
router.delete('/:id', auth, async (req, res) => {
  try {
    const propiedadId = req.params.id;
    const usuario = req.usuario;
    const query = 'SELECT propietario_id FROM Propiedades WHERE id = $1';
    const propiedad = await db.query(query, [propiedadId]);
    
    if (propiedad.rows.length === 0) return res.status(404).json({ msg: 'No encontrada' });
    if (propiedad.rows[0].propietario_id !== usuario.id && usuario.rol !== 'ADMIN') {
      return res.status(403).json({ msg: 'Permiso denegado' });
    }

    await db.query('DELETE FROM Propiedades WHERE id = $1', [propiedadId]);
    res.json({ msg: 'Eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

module.exports = router;