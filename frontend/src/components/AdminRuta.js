// src/components/AdminRuta.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRuta = ({ children }) => {
  const token = localStorage.getItem('token');
  const usuarioData = localStorage.getItem('usuario');
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;

  // 1. ¿Está logueado?
  if (!token || !usuario) {
    return <Navigate to="/login" />;
  }

  // 2. ¿Es ADMIN O SUPER_USUARIO?
  if (usuario.rol !== 'ADMIN' && usuario.rol !== 'SUPER_USUARIO') {
    // Si es CLIENTE o AGENTE, lo mandamos al inicio.
    alert('Acceso denegado. Solo para Administradores.');
    return <Navigate to="/" />;
  }

  // ¡Permiso concedido!
  return children;
};

export default AdminRuta;