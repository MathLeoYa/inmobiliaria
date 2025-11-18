// src/components/RutaProtegida.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// Este componente envuelve a otros componentes
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Si no hay token, lo redirigimos a /login
    return <Navigate to="/login" />;
  }

  // Si hay token, mostramos el componente que está "adentro" (los children)
  return children;
};

export default RutaProtegida;