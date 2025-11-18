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
    // 1. Obtenemos el ID del usuario (del token)
    const usuarioId = req.usuario.id;

    // 2. Escribimos la consulta SQL con un JOIN
    //    Queremos seleccionar TODO de "Propiedades"
    //    DONDE la propiedad.id exista en la tabla "Favoritos"
    //    Y pertenezca a NUESTRO usuarioId.
    const query = `
      SELECT T1.* FROM Propiedades AS T1
      INNER JOIN Favoritos AS T2
        ON T1.id = T2.propiedad_id
      WHERE T2.usuario_id = $1
      ORDER BY T2.fecha_agregado DESC; -- Mostrar los "me gusta" más recientes primero
    `;
    
    const misFavoritos = await db.query(query, [usuarioId]);

    // 3. Respondemos con la lista de propiedades favoritas
    res.json(misFavoritos.rows);

  } catch (err) {
    console.error('Error en GET /favoritos/me:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;