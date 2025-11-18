// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [mensaje, setMensaje] = useState('');

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    try {
      // 1. Llamamos al endpoint de Login
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // 2. ¡Éxito! El backend nos devuelve un token y datos del usuario
      console.log('Respuesta del Login:', res.data);

      // --- ¡¡ESTE ES EL PASO MÁS IMPORTANTE!! ---
      // Guardamos el token y los datos del usuario en el navegador
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));

      setMensaje(`¡Bienvenido, ${res.data.usuario.nombre}!`);

      // Opcional: recargar la página para que la app sepa que estamos logueados
      // window.location.reload();

    } catch (err) {
      // 4. Si falla (ej. contraseña incorrecta)
      console.error('Error en el login:', err.response.data);
      setMensaje(`Error: ${err.response.data.msg}`);

      // Borramos cualquier token viejo si el login falla
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', border: '1px solid #ccc', marginTop: '20px' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={onSubmit}>
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
          Entrar
        </button>
      </form>

      {mensaje && (
        <p style={{ marginTop: '15px', color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
          {mensaje}
        </p>
      )}
    </div>
  );
};

export default Login;