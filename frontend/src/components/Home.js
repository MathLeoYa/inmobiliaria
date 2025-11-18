// src/components/Home.js
import React from 'react';

const Home = () => {
  // Intentamos leer al usuario desde el localStorage
  const usuarioData = localStorage.getItem('usuario');
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Bienvenido a la Plataforma Inmobiliaria</h1>
      {usuario ? (
        <div>
          <h3>Hola, {usuario.nombre}!</h3>
          <p>Tu rol es: <strong>{usuario.rol}</strong></p>
        </div>
      ) : (
        <p>Por favor, inicia sesión o regístrate.</p>
      )}
    </div>
  );
};

export default Home;