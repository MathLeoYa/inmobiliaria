// index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Cargar variables de entorno una sola vez al principio

// Importar configuración de BD (Asegúrate de que este archivo exporte una función si lo usas así)
// Si tu archivo db.js solo exporta el 'pool', no necesitas ejecutar connectDB() aquí,
// pero si tienes una función de prueba de conexión, úsala.
// const db = require('./config/db'); // Descomenta si quieres probar conexión manual

// --- Importar rutas ---
const authRoutes = require('./routes/auth');
const propiedadesRoutes = require('./routes/propiedades'); 
const favoritosRoutes = require('./routes/favoritos'); 
const usuariosRoutes = require('./routes/usuarios');
const uploadRoutes = require('./routes/upload');
const configuracionRoutes = require('./routes/configuracion');
const locationsRoutes = require('./routes/locations');
const notificacionesRoutes = require('./routes/notificaciones');

// Inicializar App
const app = express();

// --- CAPA DE SEGURIDAD 1: HELMET (Protección de Cabeceras) ---
app.use(helmet());

// --- CAPA DE SEGURIDAD 2: CORS ESTRICTO (Control de Acceso) ---
const corsOptions = {
  origin: 'http://localhost:3000', // Solo tu frontend puede hablar con el backend
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// --- CAPA DE SEGURIDAD 3: RATE LIMITING (Anti Fuerza Bruta) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.'
});
app.use('/api/', limiter); // Aplicar solo a las rutas de API

// Middleware para leer JSON
app.use(express.json({ extended: false }));

// --- Ruta de prueba (Health Check) ---
app.get('/', (req, res) => {
  res.send('<h1>✅ API Inmobiliaria Segura y Corriendo</h1>');
});

// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/propiedades', propiedadesRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/suscripciones', require('./routes/suscripciones'));
app.use('/api/planes', require('./routes/planes'));
// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend BLINDADO corriendo en http://localhost:${PORT}`);
});