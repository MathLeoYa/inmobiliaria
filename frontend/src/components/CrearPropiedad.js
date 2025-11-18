// src/components/CrearPropiedad.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, Typography, Paper, Grid } from '@mui/material';

// Iconos
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// (Componente MapController sin cambios)
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

  return <Marker draggable={true} eventHandlers={eventHandlers} position={markerPos} ref={markerRef} />;
}

const CrearPropiedad = () => {
  const navigate = useNavigate();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '', descripcion: '', precio: '',
    tipo: 'Casa', // Valor por defecto
    operacion: 'Venta',
    habitaciones: '', banos: '', area_m2: '',
    latitud: -4.0080, longitud: -79.2045, direccion_texto: '',
    provincia: '', ciudad: '', sector: '',
  });
  
  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [provinciaIdSeleccionada, setProvinciaIdSeleccionada] = useState('');
  const [archivos, setArchivos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-4.0080, -79.2045]);

  // --- Lógica para ocultar campos ---
  // Si el tipo es Terreno o Camping, no pedimos habitaciones/baños
  const mostrarDetallesHabitables = !['Terreno', 'Camping'].includes(formData.tipo);

  // Cargar Provincias
  useEffect(() => {
    axios.get('http://localhost:5000/api/locations/provincias')
      .then(res => setProvincias(res.data))
      .catch(err => console.error(err));
  }, []);

  // Cargar Cantones
  useEffect(() => {
    if (!provinciaIdSeleccionada) { setCantones([]); return; }
    axios.get(`http://localhost:5000/api/locations/cantones/${provinciaIdSeleccionada}`)
      .then(res => setCantones(res.data))
      .catch(err => console.error(err));
  }, [provinciaIdSeleccionada]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const onFileChange = (e) => setArchivos(e.target.files);
  const handleMapPositionChange = (pos) => setFormData(prev => ({ ...prev, latitud: pos[0], longitud: pos[1] }));
  
  const handleProvinciaChange = (e) => {
    const pid = e.target.value;
    const pNombre = provincias.find(p => p.id === pid)?.nombre || '';
    setProvinciaIdSeleccionada(pid);
    setFormData(prev => ({ ...prev, provincia: pNombre, ciudad: '' }));
  };

  const handleCantonChange = (e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    if (!archivos || archivos.length === 0) {
      setMensaje('Error: Debes subir al menos una foto.');
      setLoading(false); return;
    }
    if (!formData.provincia || !formData.ciudad) {
      setMensaje('Error: La ubicación es obligatoria.');
      setLoading(false); return;
    }

    const token = localStorage.getItem('token');
    let urlsDeFotos = [];

    try {
      // Subida de fotos
      setMensaje('Subiendo imágenes...');
      const promesas = [];
      for (let i = 0; i < archivos.length; i++) {
        const form = new FormData();
        form.append('image', archivos[i]);
        promesas.push(axios.post('http://localhost:5000/api/upload', form, { headers: { 'x-auth-token': token } }));
      }
      const resFotos = await Promise.all(promesas);
      urlsDeFotos = resFotos.map(r => r.data.url);
      
    } catch (err) {
      setLoading(false); setMensaje('Error subiendo fotos.'); return;
    }

    // Preparamos los datos. Si es Terreno, forzamos 0 en habitaciones/baños
    const datosFinales = {
      ...formData,
      precio: parseFloat(formData.precio),
      area_m2: parseInt(formData.area_m2),
      habitaciones: mostrarDetallesHabitables ? parseInt(formData.habitaciones) : 0,
      banos: mostrarDetallesHabitables ? parseInt(formData.banos) : 0,
      fotos: urlsDeFotos
    };

    try {
      const res = await axios.post('http://localhost:5000/api/propiedades', datosFinales, { headers: { 'x-auth-token': token } });
      setMensaje('¡Publicado!');
      navigate(`/propiedad/${res.data.propiedad.id}`);
    } catch (err) {
      setLoading(false); setMensaje(`Error: ${err.response?.data?.msg}`);
    }
  };

  return (
    <Box sx={{  maxWidth: '1100px', margin: '120px auto 40px auto', p: 2  }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a237e', mb: 3 }}>
        Publicar Propiedad
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
        <form onSubmit={onSubmit}>
          
          {/* SECCIÓN 1: INFO BÁSICA */}
          <Typography variant="h6" sx={{ mb: 2, color: '#555' }}>Información Básica</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField label="Título del Anuncio" name="titulo" value={formData.titulo} onChange={onChange} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operación</InputLabel>
                <Select name="operacion" value={formData.operacion} label="Operación" onChange={onChange}>
                  <MenuItem value="Venta">Venta</MenuItem>
                  <MenuItem value="Arriendo">Arriendo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Precio ($)" name="precio" type="number" value={formData.precio} onChange={onChange} required fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descripción" name="descripcion" value={formData.descripcion} onChange={onChange} multiline rows={4} fullWidth />
            </Grid>
          </Grid>

          {/* SECCIÓN 2: DETALLES DEL INMUEBLE (DINÁMICO) */}
          <Typography variant="h6" sx={{ mb: 2, color: '#555' }}>Detalles del Inmueble</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Inmueble</InputLabel>
                <Select name="tipo" value={formData.tipo} label="Tipo de Inmueble" onChange={onChange}>
                  <MenuItem value="Casa">Casa</MenuItem>
                  <MenuItem value="Departamento">Departamento</MenuItem>
                  <MenuItem value="Comercial">Comercial</MenuItem>
                  <MenuItem value="Terreno">Terreno</MenuItem>
                  <MenuItem value="Camping">Camping</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* --- AQUÍ ESTÁ LA MAGIA CONDICIONAL --- */}
            <Grid item xs={12} sm={6}>
               <TextField label="Área Total (m²)" name="area_m2" type="number" value={formData.area_m2} onChange={onChange} required fullWidth />
            </Grid>

            {mostrarDetallesHabitables && (
              <>
                <Grid item xs={6}>
                  <TextField label="Habitaciones" name="habitaciones" type="number" value={formData.habitaciones} onChange={onChange} fullWidth />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Baños" name="banos" type="number" value={formData.banos} onChange={onChange} fullWidth />
                </Grid>
              </>
            )}
          </Grid>

          {/* SECCIÓN 3: UBICACIÓN */}
          <Typography variant="h6" sx={{ mb: 2, color: '#555' }}>Ubicación</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Provincia</InputLabel>
                  <Select value={provinciaIdSeleccionada} label="Provincia" onChange={handleProvinciaChange}>
                     {provincias.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!provinciaIdSeleccionada}>
                  <InputLabel>Ciudad</InputLabel>
                  <Select name="ciudad" value={formData.ciudad} label="Ciudad" onChange={handleCantonChange}>
                     {cantones.map(c => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
             </Grid>
             <Grid item xs={12}>
                <TextField label="Dirección exacta (Calle, referencia)" name="direccion_texto" value={formData.direccion_texto} onChange={onChange} fullWidth />
             </Grid>
             <Grid item xs={12}>
                <Box sx={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                  <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <MapController center={mapCenter} setPosicion={handleMapPositionChange} />
                  </MapContainer>
                </Box>
                <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                   Arrastra el marcador para ajustar la ubicación exacta.
                </Typography>
             </Grid>
          </Grid>

          {/* SECCIÓN 4: FOTOS */}
          <Typography variant="h6" sx={{ mb: 2, color: '#555' }}>Galería</Typography>
          <Box sx={{ mb: 3, border: '2px dashed #ccc', borderRadius: '8px', p: 3, textAlign: 'center', backgroundColor: '#fafafa' }}>
             <input type="file" multiple accept="image/*" onChange={onFileChange} style={{ display: 'block', margin: '0 auto' }} />
             <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>{archivos ? `${archivos.length} fotos seleccionadas` : 'Sube al menos una foto'}</Typography>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}>
            {loading ? 'Publicando...' : 'Publicar Propiedad'}
          </Button>

        </form>
        {mensaje && <Typography sx={{ mt: 2, color: mensaje.startsWith('Error') ? 'red' : 'green', textAlign: 'center' }}>{mensaje}</Typography>}
      </Paper>
    </Box>
  );
};

export default CrearPropiedad;