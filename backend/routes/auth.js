// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // ¡Importante! Añadir esto

const router = express.Router();

// --- Endpoint: POST /api/auth/register ---
// (Este código ya lo tienes)
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese todos los campos' });
  }

  try {
    const userExists = await db.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserQuery = `
      INSERT INTO Usuarios (nombre, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, email, rol;
    `;
    
    const newUser = await db.query(newUserQuery, [nombre, email, passwordHash]);

    res.status(201).json({
      msg: 'Usuario registrado exitosamente',
      usuario: newUser.rows[0],
    });

  } catch (err) {
    console.error('Error en /register:', err.message);
    res.status(500).send('Error del servidor');
  }
});

// --- ⭐ NUEVO Endpoint: POST /api/auth/login ⭐ ---
router.post('/login', async (req, res) => {
  // 1. Obtener email y password del body
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, ingrese email y contraseña' });
  }

  try {
    // 2. Buscar al usuario en la BD por su email
    const userQuery = await db.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      // Usamos un mensaje genérico por seguridad
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const usuario = userQuery.rows[0];

    // 3. Comparar la contraseña enviada con el hash de la BD
    // bcrypt.compare hace la magia de comparar texto plano vs. hash
    const isMatch = await bcrypt.compare(password, usuario.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // 4. Si la contraseña es correcta, CREAR EL TOKEN (JWT)
    // El "payload" es la información que guardamos en el token
    const payload = {
      usuario: {
        id: usuario.id,
        rol: usuario.rol,
      },
    };

    // Firmamos el token con nuestro secreto del archivo .env
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // La clave secreta que pusimos en .env
      { expiresIn: '7d' }, // El token expira en 7 días
      (err, token) => {
        if (err) throw err;
        
        // 5. Enviamos el token al frontend
        res.json({
          msg: 'Inicio de sesión exitoso',
          token: token,
          usuario: { // <-- Ahora enviamos el estado también
             id: usuario.id,
             nombre: usuario.nombre,
             email: usuario.email,
             rol: usuario.rol,
             estado_agente: usuario.estado_agente ,
             foto_perfil: usuario.foto_perfil// <-- LÍNEA AÑADIDA
          }
        });
      }
    );

  } catch (err) {
    console.error('Error en /login:', err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;