// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // ¡Importante! Añadir esto

const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    // 1. Verificar el token con Google (Seguridad crítica)
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();

    // 2. Buscar si el usuario ya existe
    const userCheck = await db.query('SELECT * FROM Usuarios WHERE email = $1', [email]);

    let usuario;

    if (userCheck.rows.length > 0) {
        // --- USUARIO EXISTE: INICIAR SESIÓN ---
        usuario = userCheck.rows[0];
        
        // Si no tenía google_id guardado, lo actualizamos (vinculación de cuenta)
        if (!usuario.google_id) {
            await db.query('UPDATE Usuarios SET google_id = $1, foto_perfil = COALESCE(foto_perfil, $2) WHERE id = $3', 
                [googleId, picture, usuario.id]
            );
        }
    } else {
        // --- USUARIO NUEVO: REGISTRAR ---
        // Generamos una contraseña aleatoria segura porque entra por Google
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const newUser = await db.query(
            `INSERT INTO Usuarios (nombre, email, password_hash, google_id, foto_perfil, rol, estado_agente) 
             VALUES ($1, $2, $3, $4, $5, 'CLIENTE', 'NO_SOLICITADO') 
             RETURNING *`,
            [name, email, passwordHash, googleId, picture]
        );
        usuario = newUser.rows[0];
    }

    // 3. Generar JWT (Igual que en el login normal)
    const payload = {
        usuario: { id: usuario.id, rol: usuario.rol }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        // Quitamos hash antes de enviar
        delete usuario.password_hash;
        res.json({ token, usuario });
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: 'Token de Google inválido o error en servidor' });
  }
});

module.exports = router;