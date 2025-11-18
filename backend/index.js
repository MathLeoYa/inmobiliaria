// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

// --- Importar nuestras rutas ---
const authRoutes = require('./routes/auth');
const propiedadesRoutes = require('./routes/propiedades'); 
const favoritosRoutes = require('./routes/favoritos'); 
const usuariosRoutes = require('./routes/usuarios');
const uploadRoutes = require('./routes/upload');
const configuracionRoutes = require('./routes/configuracion');
const locationsRoutes = require('./routes/locations');
// Inicializar la app de Express
const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Ruta de prueba ---
app.get('/', (req, res) => {
  res.send('<h1>¡El motor (API) de la Inmobiliaria está funcionando!</h1>');
});

// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/propiedades', propiedadesRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/locations', locationsRoutes);
// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});