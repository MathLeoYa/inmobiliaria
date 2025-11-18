// routes/upload.js
const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary'); // Nuestra config de cloudinary
const auth = require('../middleware/auth'); // Guardián de login
const upload = require('../middleware/upload'); // Nuestro middleware multer

// --- Endpoint: POST /api/upload ---
// [PROTEGIDO] Sube una sola imagen a Cloudinary.
// Usamos 'upload.single("image")' - "image" debe ser el nombre del campo en el form-data

router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    // 1. Verificar que multer nos pasó un archivo
    if (!req.file) {
      return res.status(400).json({ msg: 'No se ha subido ningún archivo' });
    }

    // 2. Subir el archivo desde el buffer de memoria a Cloudinary
    // Usamos un 'stream' para subirlo
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        // Opcional: organizar en carpetas dentro de Cloudinary
        folder: 'inmobiliaria/propiedades',
        // Opcional: optimizar la imagen
        transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Error subiendo a Cloudinary:', error);
          return res.status(500).json({ msg: 'Error al subir la imagen' });
        }

        // 3. Devolver la URL segura y el ID público
        res.status(200).json({
          msg: 'Imagen subida exitosamente',
          url: result.secure_url, // La URL HTTPS de la imagen
          public_id: result.public_id, // El ID para borrarla después
        });
      }
    );

    // Ejecutamos el stream pasándole el buffer del archivo
    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error('Error en POST /upload:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;