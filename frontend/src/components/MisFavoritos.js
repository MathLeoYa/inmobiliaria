// src/components/MisFavoritos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Para los detalles

const MisFavoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMisFavoritos = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Acceso denegado');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          'http://localhost:5000/api/favoritos/me',
          {
            headers: { 'x-auth-token': token }
          }
        );

        // ¡OJO! El backend ya nos da las propiedades, no los favoritos.
        // Pero necesitamos la foto principal, así que haremos
        // una consulta extra por cada uno. (Ineficiente, pero funciona por ahora)
        // *Una mejor solución a futuro sería que el backend /me devuelva las fotos.*

        // Por ahora, solo cargamos los datos que tenemos:
        setFavoritos(res.data);
        setLoading(false);

      } catch (err) {
        console.error('Error cargando favoritos:', err);
        setError('No se pudieron cargar tus favoritos.');
        setLoading(false);
      }
    };

    fetchMisFavoritos();
  }, []);

  if (loading) return <p>Cargando tus favoritos...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mis Propiedades Favoritas</h2>

      {favoritos.length === 0 && (
         <p>Aún no has guardado ninguna propiedad como favorita.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {favoritos.map((prop) => (
          <div key={prop.id} style={{ border: '1px solid #ccc', padding: '15px', width: '300px', borderRadius: '8px' }}>

            {/* Nota: Este endpoint no trae la 'foto_principal'. 
                Lo ideal sería modificar el backend para que la incluya,
                pero por ahora se verá sin foto. */}

            <h3 style={{ marginTop: '10px' }}>{prop.titulo}</h3>
            <p style={{ color: 'green', fontSize: '1.2em', fontWeight: 'bold' }}>
              ${new Intl.NumberFormat('es-US').format(prop.precio)}
            </p>
            <p>{prop.habitaciones} hab. | {prop.banos} baños</p>

            <Link to={`/propiedad/${prop.id}`} style={{ marginLeft: '10px' }}>
              Ver Detalles
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisFavoritos;