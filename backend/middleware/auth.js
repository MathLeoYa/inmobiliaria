// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Esta es la función middleware
function auth(req, res, next) {
  // 1. Obtenemos el token del encabezado (header) de la petición
  // El frontend nos lo enviará como 'x-auth-token'
  const token = req.header('x-auth-token');

  // 2. Si no hay token, no hay acceso
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, permiso denegado' });
  }

  try {
    // 3. Verificamos el token (usando nuestro JWT_SECRET)
    // jwt.verify "descifra" el token y nos devuelve el payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. ¡El token es válido!
    // Guardamos los datos del usuario (que venían en el token)
    // en el objeto 'req' (request) para que las rutas futuras lo usen.
    req.usuario = decoded.usuario;

    // 5. Dejamos que la petición continúe
    next();
  } catch (err) {
    // 6. Si el token no es válido (ej. está expirado o malformado)
    res.status(401).json({ msg: 'El token no es válido' });
  }
}

module.exports = auth;