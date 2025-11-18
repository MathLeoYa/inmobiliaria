// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const token = localStorage.getItem('token');

  // Función para cargar las solicitudes pendientes
  const fetchSolicitudes = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/usuarios/solicitudes-pendientes',
        {
          headers: { 'x-auth-token': token }
        }
      );
      setSolicitudes(res.data);
      setLoading(false);
    } catch (err) {
      setError('No se pudieron cargar las solicitudes.');
      setLoading(false);
    }
  };

  // Usamos useEffect para cargar los datos cuando el componente se monta
  useEffect(() => {
    fetchSolicitudes();
  }, []); // El '[]' asegura que se ejecute solo una vez al cargar

  // Función para el botón "Aprobar"
  const handleAprobar = async (usuarioId) => {
    setMensaje(''); // Limpiamos mensajes
    try {
      // Llamamos al endpoint de aprobación que ya creamos
      const res = await axios.put(
        `http://localhost:5000/api/usuarios/${usuarioId}/aprobar-agente`,
        {}, // No necesita body
        {
          headers: { 'x-auth-token': token }
        }
      );

      setMensaje(res.data.msg); // "Usuario aprobado..."

      // Para actualizar la UI, quitamos al usuario de la lista
      setSolicitudes(solicitudes.filter(user => user.id !== usuarioId));

    } catch (err) {
      setMensaje(`Error: ${err.response.data.msg}`);
    }
  };

  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Panel de Administrador - Solicitudes Pendientes</h2>

      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      {solicitudes.length === 0 ? (
        <p>No hay solicitudes pendientes por ahora.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nombre</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.nombre}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleAprobar(user.id)}
                    style={{ background: 'blue', color: 'white', padding: '5px 10px' }}
                  >
                    Aprobar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPanel;