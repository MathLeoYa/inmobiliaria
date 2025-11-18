// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios'; // <-- 1. IMPORTAR AXIOS

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
  });
  
  // Agregamos un estado para mensajes de éxito o error
  const [mensaje, setMensaje] = useState('');

  const { nombre, email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. ACTUALIZAMOS LA FUNCIÓN ONSUBMIT ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje(''); // Limpiamos mensajes anteriores

    try {
      // Creamos el objeto con los datos (ya están en 'formData')
      
      // ¡Esta es la llamada a tu backend!
      const res = await axios.post(
        'http://localhost:5000/api/auth/register', // La URL de tu API
        formData, // El body (los datos)
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Si todo sale bien (Status 201)
      console.log('Respuesta del servidor:', res.data);
      setMensaje(`¡Registro exitoso! ${res.data.usuario.nombre}, bienvenido.`);
      // Aquí podrías redirigir al login o loguearlo automáticamente

    } catch (err) {
      // Si el backend devuelve un error (ej. email ya existe)
      console.error('Error en el registro:', err.response.data);
      setMensaje(`Error: ${err.response.data.msg}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Crear una Cuenta</h2>
      <form onSubmit={onSubmit}>
        {/* (Los campos del formulario no cambian) */}
        <div style={{ marginBottom: '10px' }}>
          <label>Nombre:</label><br />
          <input
            type="text"
            name="nombre"
            value={nombre}
            onChange={onChange}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label><br />
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Contraseña:</label><br />
          <input
           type="password"
           name="password"
            value={password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          Registrar
        </button>
      </form>
      
      {/* 3. MOSTRAMOS EL MENSAJE DE RESPUESTA */}
      {mensaje && (
        <p style={{ marginTop: '15px', color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
          {mensaje}
        </p>
      )}
    </div>
  );
};

export default Register;