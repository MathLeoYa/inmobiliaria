// src/components/EditarPropiedad.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// (Solución al icono, sin cambios)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- (Componente MapController, sin cambios) ---
function MapController({ center, setPosicion }) {
  const [markerPos, setMarkerPos] = useState(center);
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 15);
    setMarkerPos(center);
  }, [center, map]);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setMarkerPos(newPos);
      setPosicion(newPos);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = [marker.getLatLng().lat, marker.getLatLng().lng];
          setPosicion(newPos);
        }
      },
    }),
    [setPosicion],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPos}
      ref={markerRef}
    />
  );
}

// --- COMPONENTE PRINCIPAL (COMPLETO Y CORREGIDO) ---
const EditarPropiedad = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: 0,
    tipo: 'Casa',
    habitaciones: 0,
    banos: 0,
    area_m2: 0,
    latitud: -4.0080,
    longitud: -79.2045,
    direccion_texto: '',
  });
  
  const [archivos, setArchivos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([-4.0080, -79.2045]);

  // --- Cargar datos de la propiedad ---
  useEffect(() => {
    const fetchPropiedad = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/propiedades/${id}`);
        const data = res.data;
        
        // --- AQUÍ ESTÁ LA CORRECCIÓN ---
        // El backend envía 'latitud' y 'longitud' como Strings
        // Debemos convertirlos a Números (float)
        const lat = parseFloat(data.latitud);
        const lng = parseFloat(data.longitud);

        setFormData({
          titulo: data.titulo || '',
          descripcion: data.descripcion || '',
          precio: data.precio || 0,
          tipo: data.tipo || 'Casa',
          habitaciones: data.habitaciones || 0,
          banos: data.banos || 0,
          area_m2: data.area_m2 || 0,
          latitud: lat,  // <-- Usar el número
          longitud: lng, // <-- Usar el número
          direccion_texto: data.direccion_texto || '',
        });
        
        setMapCenter([lat, lng]); // <-- Usar los números
        setLoading(false);

      } catch (err) {
        console.error(err);
        setMensaje('Error: No se pudo cargar la propiedad para editar.');
        setLoading(false);
      }
    };

    fetchPropiedad();
  }, [id]);

  // --- Funciones helper (Ahora sí están todas) ---
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onFileChange = (e) => {
    setArchivos(e.target.files);
  };
  
  const handleMapPositionChange = (pos) => {
    setFormData(prevState => ({
      ...prevState,
      latitud: pos[0],
      longitud: pos[1]
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setMensaje('Buscando ubicación...');
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setFormData(prevState => ({ ...prevState, latitud: newPos[0], longitud: newPos[1] }));
        setMapCenter(newPos);
        setMensaje('Ubicación encontrada.');
      } else {
        setMensaje('Error: Ubicación no encontrada.');
      }
    } catch (err) {
      setMensaje('Error al buscar la ubicación.');
    }
    setLoading(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMensaje('Error: La geolocalización no es soportada.');
      return;
    }
    setLoading(true);
    setMensaje('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = [position.coords.latitude, position.coords.longitude];
        setFormData(prevState => ({ ...prevState, latitud: newPos[0], longitud: newPos[1], direccion_texto: 'Ubicación actual' }));
        setMapCenter(newPos);
        setMensaje('Ubicación actual obtenida.');
        setLoading(false);
      },
      (err) => {
        setMensaje('Error: No se pudo obtener la ubicación.');
        setLoading(false);
      }
    );
  };
  
  // --- Función de envío (PUT) ---
  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    const token = localStorage.getItem('token');
    
    if (archivos) {
      setMensaje('Advertencia: La edición de fotos no está implementada. Los cambios en fotos no se guardarán.');
    }

    const datosParaEnviar = {
      ...formData,
      precio: parseFloat(formData.precio),
      habitaciones: parseInt(formData.habitaciones),
      banos: parseInt(formData.banos),
      area_m2: parseInt(formData.area_m2),
    };

    try {
      const res = await axios.put(
        `http://localhost:5000/api/propiedades/${id}`,
        datosParaEnviar,
        { headers: { 'x-auth-token': token } }
      );

      setLoading(false);
      setMensaje('¡Propiedad actualizada exitosamente!');
      navigate(`/propiedad/${res.data.propiedad.id}`);

    } catch (err) {
      setLoading(false);
      setMensaje(`Error actualizando propiedad: ${err.response?.data?.msg || err.message}`);
    }
  };


  // --- Renderizado ---
  if (loading && !formData.titulo) {
    return <p>Cargando datos de la propiedad...</p>;
  }

  // Desestructuramos el formData para los 'value'
  const {
    titulo, descripcion, precio, tipo, habitaciones, banos,
    area_m2, latitud, longitud, direccion_texto
  } = formData;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>Editar Propiedad</h2>
      <form onSubmit={onSubmit}>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Fotos (Edición no disponible por ahora):</label><br />
          <input type="file" name="fotos" onChange={onFileChange} multiple accept="image/*" disabled />
        </div>
        
        {/* --- AQUÍ ESTÁN TODOS LOS CAMPOS QUE FALTABAN --- */}
        <div style={{ marginBottom: '10px' }}>
            <label>Título:</label>
            <input type="text" name="titulo" value={titulo} onChange={onChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
            <label>Descripción:</label>
            <textarea name="descripcion" value={descripcion} onChange={onChange} style={{ width: '100%', height: '80px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
            <label>Precio ($):</label>
            <input type="number" name="precio" value={precio} onChange={onChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
            <label>Tipo:</label>
            <select name="tipo" value={tipo} onChange={onChange} style={{ width: '100%' }}>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
            </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" name="habitaciones" value={habitaciones} onChange={onChange} placeholder="Habitaciones" style={{ flex: 1 }} />
            <input type="number" name="banos" value={banos} onChange={onChange} placeholder="Baños" style={{ flex: 1 }} />
            <input type="number" name="area_m2" value={area_m2} onChange={onChange} placeholder="Área (m²)" style={{ flex: 1 }} />
        </div>
        
        <h4 style={{ marginTop: '20px' }}>Ubicación</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Cuenca, Ecuador"
            style={{ flex: 3 }}
          />
          <button type="button" onClick={handleSearch} disabled={loading} style={{ flex: 1 }}>
            Buscar
          </button>
        </div>
        <button type="button" onClick={handleCurrentLocation} disabled={loading} style={{ width: '100%', marginBottom: '10px' }}>
          📍 Usar mi ubicación actual
        </button>

        <div style={{ height: '350px', width: '100%', marginBottom: '10px' }}>
          <MapContainer 
            center={mapCenter}
            zoom={15} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} setPosicion={handleMapPositionChange} />
          </MapContainer>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Dirección (Texto):</label>
          <input type="text" name="direccion_texto" value={direccion_texto} onChange={onChange} style={{ width: '100%' }} />
        </div>
        
        {/* --- ESTA LÍNEA AHORA FUNCIONARÁ --- */}
        <p style={{ fontSize: '0.9em', color: '#555' }}>
            Lat: {latitud.toFixed(6)}, Lng: {longitud.toFixed(6)}
        </p>
        
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', marginTop: '10px', background: 'blue', color: 'white' }}>
          {loading ? 'Actualizando...' : 'Actualizar Propiedad'}
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

export default EditarPropiedad;