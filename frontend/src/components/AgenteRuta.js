// src/components/AgenteRuta.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const AgenteRuta = ({ children }) => {
  const token = localStorage.getItem('token');
  const usuarioData = localStorage.getItem('usuario');
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;

  // 1. ¿Está logueado?
  if (!token || !usuario) {
    return <Navigate to="/login" />;
  }

  // 2. ¿Es Agente O Admin? (Los Admins también pueden publicar)
  if (usuario.rol !== 'AGENTE' && usuario.rol !== 'ADMIN') {
    // Si es un simple CLIENTE, lo mandamos al inicio.
    alert('Acceso denegado. Solo para Agentes.');
    return <Navigate to="/" />;
  }

  // ¡Permiso concedido!
  return children;
};

export default AgenteRuta;