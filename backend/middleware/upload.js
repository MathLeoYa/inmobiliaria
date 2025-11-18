// middleware/upload.js
const multer = require('multer');

// Configuración de Multer para guardar en memoria
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo se aceptan imágenes.'), false);
  }
};

// Límite de tamaño (ej. 5MB)
const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

// Exportamos el middleware para usarlo en una sola foto ('.single()')
module.exports = upload;