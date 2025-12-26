const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 1. GET /api/planes (Público: Para mostrar en la web "Nuestros Planes")
router.get('/', async (req, res) => {
  try {
    // Solo traemos los planes activos ordenados por precio
    const planes = await db.query('SELECT * FROM planes WHERE es_activo = true ORDER BY precio ASC');
    res.json(planes.rows);
  } catch (err) {
    res.status(500).send('Error al obtener planes');
  }
});

// 2. POST /api/planes (Privado Admin: Crear nuevo plan)
router.post('/', [auth, admin], async (req, res) => {
  const { nombre, precio, max_propiedades, max_fotos, duracion_dias, prioridad, descripcion } = req.body;
  try {
    const nuevo = await db.query(
      `INSERT INTO planes (nombre, precio, max_propiedades, max_fotos, duracion_dias, prioridad_busqueda, descripcion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, precio, max_propiedades, max_fotos, duracion_dias, prioridad, descripcion]
    );
    res.json(nuevo.rows[0]);
  } catch (err) {
    res.status(500).send('Error al crear plan');
  }
});

// 3. PUT /api/planes/:id (Privado Admin: Editar precios/ofertas)
router.put('/:id', [auth, admin], async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, precio_oferta, max_propiedades, es_activo } = req.body;
  try {
    await db.query(
      `UPDATE planes SET nombre=$1, precio=$2, precio_oferta=$3, max_propiedades=$4, es_activo=$5 WHERE id=$6`,
      [nombre, precio, precio_oferta, max_propiedades, es_activo, id]
    );
    res.json({ msg: 'Plan actualizado' });
  } catch (err) {
    res.status(500).send('Error al actualizar');
  }
});

module.exports = router;