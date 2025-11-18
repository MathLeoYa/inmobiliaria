// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuramos cloudinary con las llaves del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Usar https
});

module.exports = cloudinary;