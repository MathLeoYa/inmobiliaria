// routes/favoritos.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Nuestro conector de BD
const auth = require('../middleware/auth'); // ¡Nuestro guardián!

// --- Endpoint: POST /api/favoritos/:propiedadId (VERSIÓN "TOGGLE") ---
// [PROTEGIDO] Añade O Quita una propiedad de favoritos.
router.post('/:propiedadId', auth, async (req, res) => {
  try {
    // 1. Obtenemos los IDs
    const { propiedadId } = req.params;
    const usuarioId = req.usuario.id;

    // 2. Verificamos si el favorito YA EXISTE
    const favQuery = 'SELECT * FROM Favoritos WHERE usuario_id = $1 AND propiedad_id = $2';
    const favoriteExists = await db.query(favQuery, [usuarioId, propiedadId]);

    // 3. Lógica del "Toggle"
    if (favoriteExists.rows.length > 0) {
      
      // --- SI EXISTE: LO BORRAMOS ---
      const deleteQuery = 'DELETE FROM Favoritos WHERE usuario_id = $1 AND propiedad_id = $2';
      await db.query(deleteQuery, [usuarioId, propiedadId]);

      res.status(200).json({ msg: 'Propiedad quitada de favoritos' });

    } else {

      // --- SI NO EXISTE: LO CREAMOS ---
      const insertQuery = `
        INSERT INTO Favoritos (usuario_id, propiedad_id)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const nuevoFavorito = await db.query(insertQuery, [usuarioId, propiedadId]);

      res.status(201).json({
        msg: 'Propiedad añadida a favoritos',
        favorito: nuevoFavorito.rows[0],
      });
    }

  } catch (err) {
    if (err.message.includes('la sintaxis de entrada no es válida para tipo uuid')) {
      return res.status(400).json({ msg: 'ID de propiedad o usuario no válido' });
    }
    // (Ya no necesitamos el '23505' porque lo manejamos con el 'if')
    console.error('Error en POST /favoritos/:propiedadId (toggle):', err.message);
    res.status(500).send('Error del servidor');
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // AÑADIMOS LA SUB-CONSULTA PARA 'foto_principal'
    const query = `
      SELECT p.*, 
             (
                SELECT f.url_foto 
                FROM Fotos_Propiedad f 
                WHERE f.propiedad_id = p.id 
                ORDER BY f.orden ASC 
                LIMIT 1
             ) as foto_principal
      FROM Propiedades p
      INNER JOIN Favoritos f ON p.id = f.propiedad_id
      WHERE f.usuario_id = $1
      ORDER BY f.fecha_agregado DESC;
    `;
    
    const misFavoritos = await db.query(query, [usuarioId]);
    res.json(misFavoritos.rows);

  } catch (err) {
    console.error('Error en GET /favoritos/me:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;