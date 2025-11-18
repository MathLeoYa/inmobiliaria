// src/components/MisPropiedades.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const MisPropiedades = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Función para cargar las propiedades del agente
  const fetchMisPropiedades = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/propiedades/me',
        {
          headers: { 'x-auth-token': token }
        }
      );
      setPropiedades(res.data);
      setLoading(false);
    } catch (err) {
      setError('No se pudieron cargar tus propiedades.');
      setLoading(false);
    }
  };

  // Cargar los datos cuando el componente se monta
  useEffect(() => {
    fetchMisPropiedades();
  }, []); // '[]' para que se ejecute solo una vez

  // Función para el botón "Borrar"
  const handleBorrar = async (propiedadId) => {
    // Pedimos confirmación antes de borrar
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      return;
    }

    setMensaje('');
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/propiedades/${propiedadId}`,
        {
          headers: { 'x-auth-token': token }
        }
      );

      setMensaje(res.data.msg); // "Propiedad eliminada..."
      // Actualizamos la lista quitando la propiedad borrada
      setPropiedades(propiedades.filter(p => p.id !== propiedadId));

    } catch (err) {
      setMensaje(`Error: ${err.response.data.msg}`);
    }
  };

  if (loading) return <p>Cargando tus propiedades...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h2>Gestionar Mis Propiedades</h2>

      {mensaje && <p style={{ color: mensaje.startsWith('Error') ? 'red' : 'green' }}>{mensaje}</p>}

      {propiedades.length === 0 ? (
        <p>Aún no has publicado ninguna propiedad. <Link to="/publicar">¡Publica tu primera!</Link></p>
      ) : (
        propiedades.map((prop) => (
          <div key={prop.id} style={{
            border: '1px solid #ccc', padding: '15px', borderRadius: '8px',
            marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '20px'
          }}>
            {/* Imagen */}
            <img 
              src={prop.foto_principal || 'https://via.placeholder.com/150'} 
              alt={prop.titulo}
              style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
            />

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{prop.titulo}</h3>
              <p style={{ color: 'green', fontWeight: 'bold' }}>
                ${new Intl.NumberFormat('es-US').format(prop.precio)}
              </p>
              <p style={{ fontSize: '0.9em', color: '#555' }}>ID: {prop.id}</p>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to={`/propiedad/editar/${prop.id}`} style={{
                padding: '5px 10px', background: 'blue', color: 'white', 
                textDecoration: 'none', borderRadius: '4px', textAlign: 'center'
              }}>
                Editar
              </Link>
              <button 
                onClick={() => handleBorrar(prop.id)}
                style={{
                  padding: '5px 10px', background: 'red', color: 'white', 
                  border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Borrar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MisPropiedades;