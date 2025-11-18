// middleware/admin.js

function admin(req, res, next) {
  // Asumimos que el middleware 'auth' ya se ejecutó
  // y puso 'req.usuario' a nuestra disposición.
  
  if (req.usuario.rol !== 'ADMIN' && req.usuario.rol !== 'SUPER_USUARIO') {
    return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Administrador.' });
  }
  
  // Si es ADMIN o SUPER_USUARIO, lo dejamos pasar.
  next();
}

module.exports = admin;