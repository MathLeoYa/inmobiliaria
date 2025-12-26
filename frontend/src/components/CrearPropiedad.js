import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, Typography, Paper, 
  CircularProgress, Alert, Chip, Divider, Grid
} from '@mui/material';

// 1. IMPORTANTE: Importamos MarkerF (Functional Marker) en lugar de Marker
// Esto soluciona el bug de "Pin Invisible" en React 18
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete } from '@react-google-maps/api';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const containerStyle = { width: '100%', height: '550px', borderRadius: '12px' };
const LIBRARIES = ['places'];

const CrearPropiedad = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [provincias, setProvincias] = useState([]);
  const [archivos, setArchivos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const mapApiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  const [amenidades, setAmenidades] = useState([]);
  const [nuevaAmenidad, setNuevaAmenidad] = useState('');

  const [formData, setFormData] = useState({
    titulo: '', descripcion: '', precio: '',
    tipo: 'Casa', operacion: 'Venta',
    habitaciones: '', banos: '', area_m2: '',
    // Coordenadas por defecto (Quito)
    latitud: -0.1807, longitud: -78.4678, 
    direccion_texto: '',
    provincia: '', ciudad: '', calle: '', codigo_postal: ''
  });

  const mostrarDetallesHabitables = !['Terreno', 'Camping', 'Comercial'].includes(formData.tipo);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapApiKey,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/locations/provincias')
      .then(res => setProvincias(res.data))
      .catch(err => console.error(err));
  }, []);

  // --- HANDLERS AMENIDADES ---
  const handleAgregarAmenidad = () => {
    const valor = nuevaAmenidad.trim();
    if (valor && !amenidades.includes(valor)) {
        setAmenidades([...amenidades, valor]);
        setNuevaAmenidad('');
    }
  };

  const handleBorrarAmenidad = (amenidadBorrar) => {
    setAmenidades(amenidades.filter(a => a !== amenidadBorrar));
  };

  const handleAmenidadKeyPress = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault(); 
          handleAgregarAmenidad();
      }
  };

  // --- GEOCODING (DETECTAR DIRECCIÓN) ---
  const detectarUbicacion = (lat, lng) => {
    if (!window.google || !geocoderRef.current) return;

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addressComponents = results[0].address_components;
        let googleProvincia = '';
        let googleCanton = '';
        let googleCalle = '';

        addressComponents.forEach(comp => {
            if (comp.types.includes('administrative_area_level_1')) googleProvincia = comp.long_name; 
            if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) googleCanton = comp.long_name;
            if (comp.types.includes('route')) googleCalle = comp.long_name;
        });

        if (googleProvincia && provincias.length > 0) {
            const provinciaEncontrada = provincias.find(p => 
                googleProvincia.toLowerCase().includes(p.nombre.toLowerCase()) ||
                p.nombre.toLowerCase().includes(googleProvincia.toLowerCase().replace('province', '').trim())
            );

            if (provinciaEncontrada) {
                setFormData(prev => ({ 
                    ...prev, 
                    provincia: provinciaEncontrada.nombre,
                    ciudad: googleCanton || prev.ciudad,
                    direccion_texto: results[0].formatted_address,
                    calle: googleCalle || "Calle sin nombre"
                }));
            }
        } else {
             setFormData(prev => ({ 
                ...prev, 
                direccion_texto: results[0].formatted_address,
                calle: googleCalle 
            }));
        }
      }
    });
  };

  // --- MAPA HANDLERS ---
  const onLoadMap = React.useCallback((mapInstance) => {
    setMap(mapInstance);
    geocoderRef.current = new window.google.maps.Geocoder();
    
    // Ajuste inicial de renderizado
    setTimeout(() => {
      if(mapInstance) {
          window.google.maps.event.trigger(mapInstance, 'resize');
          // Solo centramos al inicio, no en cada click
          mapInstance.panTo({ lat: Number(formData.latitud), lng: Number(formData.longitud) });
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
    detectarUbicacion(lat, lng);
  };

  const onMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    // 2. SOLUCIÓN AL MOVIMIENTO BRUSCO:
    // Actualizamos las coordenadas del formulario (el pin se moverá solo)
    // PERO NO LLAMAMOS A map.panTo(). Dejamos el mapa quieto.
    setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
    
    detectarUbicacion(lat, lng);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
            // Aquí SÍ movemos el mapa porque es una búsqueda nueva
            if (map) {
              map.panTo({ lat, lng });
              map.setZoom(17);
            }
            detectarUbicacion(lat, lng);
        }
    }
  };

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const onFileChange = (e) => setArchivos(e.target.files);
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    if (!archivos || archivos.length === 0) {
      setMensaje('Error: Debes subir al menos una foto.'); setLoading(false); return;
    }
    // Validación de dirección
    if (!formData.direccion_texto) {
      setMensaje('Error: Ubicación no detectada. Mueve el pin en el mapa.'); setLoading(false); return;
    }

    const token = localStorage.getItem('token');
    let urlsDeFotos = [];

    try {
      setMensaje('Subiendo imágenes...');
      const promesas = [];
      for (let i = 0; i < archivos.length; i++) {
        const form = new FormData();
        form.append('image', archivos[i]);
        promesas.push(axios.post('http://localhost:5000/api/upload', form, { headers: { 'x-auth-token': token } }));
      }
      const resFotos = await Promise.all(promesas);
      urlsDeFotos = resFotos.map(r => r.data.url);
      
      const datosFinales = {
        ...formData,
        precio: parseFloat(formData.precio),
        area_m2: parseInt(formData.area_m2),
        habitaciones: mostrarDetallesHabitables ? parseInt(formData.habitaciones) : 0,
        banos: mostrarDetallesHabitables ? parseInt(formData.banos) : 0,
        fotos: urlsDeFotos,
        amenidades: amenidades
      };

      await axios.post('http://localhost:5000/api/propiedades', datosFinales, { headers: { 'x-auth-token': token } });
      
      alert('Propiedad publicada con éxito');
      navigate(`/mis-propiedades`);

    } catch (err) {
      if (err.response && err.response.status === 403) {
          alert("⛔ ERROR: Tu cuenta está SUSPENDIDA.");
      } else {
          setMensaje(`Error: ${err.response?.data?.msg || 'Error al publicar'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mapApiKey) {
    return <Alert severity="error">Falta la REACT_APP_GOOGLE_MAPS_KEY en el archivo .env</Alert>;
  }

  if (loadError) {
    return <Alert severity="error">Error cargando Google Maps: {loadError.message}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '40px auto', p: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a237e', mb: 3 }}>
        Publicar Propiedad
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
        <form onSubmit={onSubmit}>
          
          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            1. Información Básica
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Título del Anuncio" name="titulo" value={formData.titulo} onChange={onChange} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Operación</InputLabel>
                <Select name="operacion" value={formData.operacion} label="Operación" onChange={onChange}>
                  <MenuItem value="Venta">Venta</MenuItem>
                  <MenuItem value="Arriendo">Arriendo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Precio ($)" name="precio" type="number" value={formData.precio} onChange={onChange} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Descripción" name="descripcion" value={formData.descripcion} onChange={onChange} multiline rows={3} fullWidth />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            2. Características y Amenidades
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select name="tipo" value={formData.tipo} label="Tipo" onChange={onChange}>
                  <MenuItem value="Casa">Casa</MenuItem>
                  <MenuItem value="Departamento">Departamento</MenuItem>
                  <MenuItem value="Comercial">Comercial</MenuItem>
                  <MenuItem value="Terreno">Terreno</MenuItem>
                  <MenuItem value="Camping">Camping</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
               <TextField label="Área (m²)" name="area_m2" type="number" value={formData.area_m2} onChange={onChange} required fullWidth />
            </Grid>
            {mostrarDetallesHabitables && (
              <>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField label="Habitaciones" name="habitaciones" type="number" value={formData.habitaciones} onChange={onChange} fullWidth />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField label="Baños" name="banos" type="number" value={formData.banos} onChange={onChange} fullWidth />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a237e', fontWeight: 'bold' }}>
                    Amenidades (Ej: Gym, Piscina, Seguridad)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <TextField 
                        size="small" 
                        placeholder="Escribe y presiona Enter..." 
                        value={nuevaAmenidad}
                        onChange={(e) => setNuevaAmenidad(e.target.value)}
                        onKeyPress={handleAmenidadKeyPress}
                        sx={{ maxWidth: '400px', flex: 1 }}
                    />
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={handleAgregarAmenidad} 
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{ height: '40px' }}
                    >
                        Agregar
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, bgcolor: '#fafafa', borderRadius: '8px', minHeight: '60px', border: '1px dashed #ccc' }}>
                    {amenidades.length === 0 && (
                        <Typography variant="body2" color="textSecondary" sx={{ width: '100%', textAlign: 'center', py: 1 }}>
                            No has agregado amenidades. Escribe arriba para añadir.
                        </Typography>
                    )}
                    {amenidades.map((tag, index) => (
                        <Chip 
                            key={index} 
                            label={tag} 
                            onDelete={() => handleBorrarAmenidad(tag)} 
                            color="primary" 
                            variant="filled"
                            deleteIcon={<CloseIcon style={{ color: 'white' }} />}
                        />
                    ))}
                </Box>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            3. Ubicación Exacta
          </Typography>
          
          <Alert severity="info" icon={<LocationOnIcon />} sx={{ mb: 2 }}>
             Haz clic en el mapa para colocar el <b>PIN ROJO</b> o busca la dirección.
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
             {/* MAPA */}
             <Grid size={{ xs: 12, md: 8 }}>
              {isLoaded ? (
                <Box sx={{ position: 'relative', minHeight: '550px', border: '2px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                  
                  {/* BARRA DE BÚSQUEDA */}
                  <Box sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: '50%', 
                      transform: 'translateX(-50%)', 
                      zIndex: 10, 
                      width: '320px', 
                      maxWidth: '90%' 
                  }}>
                    <Autocomplete onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)} onPlaceChanged={onPlaceChanged}>
                      <input 
                        type="text" 
                        placeholder="🔍 Buscar..." 
                        style={{ 
                          width: '100%', height: '45px', padding: '0 20px', 
                          borderRadius: '25px', border: '1px solid #ccc', 
                          fontSize: '15px', boxShadow: '0px 4px 6px rgba(0,0,0,0.1)' 
                        }} 
                      />
                    </Autocomplete>
                  </Box>

                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    // IMPORTANTE: Aseguramos que lat/lng sean números válidos
                    center={{ 
                        lat: parseFloat(formData.latitud) || -0.1807, 
                        lng: parseFloat(formData.longitud) || -78.4678 
                    }}
                    zoom={16}
                    onLoad={onLoadMap}
                    onClick={onMapClick} 
                    options={{ 
                        mapTypeControl: true,
                        fullscreenControl: true, 
                        streetViewControl: true, 
                    }}
                  >
                    {/* 3. AQUÍ ESTÁ EL CAMBIO CLAVE: Usamos MarkerF */}
                    <MarkerF
                        position={{ 
                            lat: parseFloat(formData.latitud), 
                            lng: parseFloat(formData.longitud) 
                        }} 
                        draggable={true} 
                        onDragEnd={onMarkerDragEnd}
                        // Sin 'icon' personalizado, usa el default rojo de Google
                        // Sin 'animation' DROP para evitar el reinicio visual brusco
                    />
                  </GoogleMap>
                </Box>
              ) : (
                <CircularProgress />
              )}
             </Grid>
             
             {/* INFO LATERAL */}
             <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', minHeight: '550px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#1a237e' }}>
                        <MyLocationIcon sx={{ mr: 1, fontSize: 30 }} />
                        <Typography variant="h6" fontWeight="bold">Ubicación Detectada</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary" fontWeight="bold">CALLE / REFERENCIA</Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>{formData.calle || "Calle sin nombre"}</Typography>
                    </Box>

                    <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="bold">CIUDAD</Typography>
                            <Typography variant="body2">{formData.ciudad || "---"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="bold">PROVINCIA</Typography>
                            <Typography variant="body2">{formData.provincia || "---"}</Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 1.5, bgcolor: '#e8eaf6', borderRadius: '8px' }}>
                        <Typography variant="caption" display="block" color="textSecondary">Dirección Completa:</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {formData.direccion_texto || "Selecciona un punto en el mapa..."}
                        </Typography>
                    </Box>

                    {!formData.provincia && (
                        <Alert severity="warning" sx={{ mt: 3, fontSize: '0.85rem' }}>
                            Mueve el marcador rojo para autocompletar.
                        </Alert>
                    )}
                </Paper>
             </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            4. Galería
          </Typography>
          <Box sx={{ mb: 3, border: '2px dashed #1976d2', borderRadius: '12px', p: 4, textAlign: 'center', bgcolor: '#e3f2fd' }}>
             <input type="file" multiple accept="image/*" onChange={onFileChange} style={{ display: 'block', margin: '0 auto', cursor: 'pointer' }} />
             <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                 {archivos ? `📸 ${archivos.length} fotos listas para subir` : 'Haz clic para seleccionar fotos'}
             </Typography>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} 
            sx={{ py: 2, fontWeight: 'bold', fontSize: '1.2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)' }}
          >
            {loading ? 'Subiendo Propiedad...' : 'Publicar Propiedad Ahora'}
          </Button>

        </form>
        {mensaje && <Typography sx={{ mt: 3, color: mensaje.startsWith('Error') ? 'red' : 'green', textAlign: 'center', fontWeight: 'bold' }}>{mensaje}</Typography>}
      </Paper>
    </Box>
  );
};

export default CrearPropiedad;