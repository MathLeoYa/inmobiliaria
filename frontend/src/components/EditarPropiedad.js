import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, Typography, Paper, Grid, CircularProgress, Alert, Chip, Divider
} from '@mui/material';
import { GoogleMap, useJsApiLoader, MarkerF, Autocomplete } from '@react-google-maps/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const containerStyle = { width: '100%', height: '550px', borderRadius: '12px' };

const EditarPropiedad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [provincias, setProvincias] = useState([]);
  const [archivos, setArchivos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Estados para Amenidades
  const [amenidades, setAmenidades] = useState([]);
  const [nuevaAmenidad, setNuevaAmenidad] = useState('');

  // --- SOLUCIÓN AL ERROR DE LOADER ---
  // Definimos las librerías en un estado para que la REFERENCIA en memoria nunca cambie.
  const [libraries] = useState(['places']); 

  const [formData, setFormData] = useState({
    titulo: '', descripcion: '', precio: '',
    tipo: 'Casa', operacion: 'Venta',
    habitaciones: '', banos: '', area_m2: '',
    latitud: -0.1807, longitud: -78.4678, direccion_texto: '',
    provincia: '', ciudad: '', calle: '', codigo_postal: '' 
  });

  const mostrarDetallesHabitables = !['Terreno', 'Camping', 'Comercial'].includes(formData.tipo);

  // --- GOOGLE MAPS HOOKS ---
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY, 
    libraries: libraries // Usamos la variable de estado estable
  });

  const [map, setMap] = useState(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);

  // 1. Cargar Datos Iniciales
  useEffect(() => {
    const fetchData = async () => {
        try {
            const resProv = await axios.get('http://localhost:5000/api/locations/provincias');
            setProvincias(resProv.data);

            const resProp = await axios.get(`http://localhost:5000/api/propiedades/${id}`);
            const prop = resProp.data;

            setFormData({
                titulo: prop.titulo,
                descripcion: prop.descripcion || '',
                precio: prop.precio,
                tipo: prop.tipo,
                operacion: prop.operacion,
                habitaciones: prop.habitaciones || 0,
                banos: prop.banos || 0,
                area_m2: prop.area_m2,
                latitud: parseFloat(prop.latitud),
                longitud: parseFloat(prop.longitud),
                direccion_texto: prop.direccion_texto || '',
                provincia: prop.provincia || '',
                ciudad: prop.ciudad || '',
                calle: '', 
                codigo_postal: ''
            });

            if (prop.amenidades && Array.isArray(prop.amenidades)) {
                setAmenidades(prop.amenidades);
            }
            setDataLoaded(true);
        } catch (err) {
            console.error(err);
            setMensaje('Error al cargar la propiedad.');
        }
    };
    fetchData();
  }, [id]);

  // --- LÓGICA AMENIDADES ---
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
      if (e.key === 'Enter') { e.preventDefault(); handleAgregarAmenidad(); }
  };

  // --- GEOCODING INVERSO ---
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
             setFormData(prev => ({ ...prev, direccion_texto: results[0].formatted_address, calle: googleCalle }));
        }
      }
    });
  };

  // --- MAPA ---
  const onLoadMap = React.useCallback(function callback(map) {
    setMap(map);
    geocoderRef.current = new window.google.maps.Geocoder();
  }, []);

  const onUnmountMap = React.useCallback(function callback(map) { setMap(null); }, []);

  const onMarkerDragEnd = (e) => {
    if(!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
    detectarUbicacion(lat, lng);
  };

  const onMapClick = (e) => {
    if(!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
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
            map.panTo({ lat, lng });
            map.setZoom(17);
            detectarUbicacion(lat, lng);
        }
    }
  };

  // --- SUBMIT ---
  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const onFileChange = (e) => setArchivos(e.target.files);
  
  const onSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    const token = localStorage.getItem('token');
    let urlsDeFotos = [];

    try {
      if (archivos && archivos.length > 0) {
          setMensaje('Subiendo nuevas imágenes...');
          const promesas = [];
          for (let i = 0; i < archivos.length; i++) {
            const form = new FormData();
            form.append('image', archivos[i]);
            promesas.push(axios.post('http://localhost:5000/api/upload', form, { headers: { 'x-auth-token': token } }));
          }
          const resFotos = await Promise.all(promesas);
          urlsDeFotos = resFotos.map(r => r.data.url);
      }
      
      const datosFinales = {
        ...formData,
        precio: parseFloat(formData.precio),
        area_m2: parseInt(formData.area_m2),
        habitaciones: mostrarDetallesHabitables ? parseInt(formData.habitaciones) : 0,
        banos: mostrarDetallesHabitables ? parseInt(formData.banos) : 0,
        amenidades: amenidades,
        fotos: urlsDeFotos.length > 0 ? urlsDeFotos : undefined 
      };

      await axios.put(`http://localhost:5000/api/propiedades/${id}`, datosFinales, { headers: { 'x-auth-token': token } });
      
      alert('Propiedad actualizada con éxito');
      navigate(`/mis-propiedades`);

    } catch (err) {
      if (err.response && err.response.status === 403) {
          alert("⛔ ERROR: Tu cuenta está SUSPENDIDA.");
      } else {
          setMensaje(`Error: ${err.response?.data?.msg || 'Error al actualizar'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadError) return <Alert severity="error">Error Maps API. Recarga la página.</Alert>;
  if (!dataLoaded) return <Box sx={{ display:'flex', justifyContent:'center', mt:10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: '1200px', margin: '40px auto', p: 2 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom sx={{ color: '#1a237e', mb: 3 }}>
        Editar Propiedad
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
        <form onSubmit={onSubmit}>
          
          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            1. Información Básica
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
              <TextField label="Descripción" name="descripcion" value={formData.descripcion} onChange={onChange} multiline rows={3} fullWidth />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            2. Características y Amenidades
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
               <TextField label="Área (m²)" name="area_m2" type="number" value={formData.area_m2} onChange={onChange} required fullWidth />
            </Grid>
            {mostrarDetallesHabitables && (
              <>
                <Grid item xs={6} sm={2}>
                  <TextField label="Habitaciones" name="habitaciones" type="number" value={formData.habitaciones} onChange={onChange} fullWidth />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField label="Baños" name="banos" type="number" value={formData.banos} onChange={onChange} fullWidth />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#1a237e', fontWeight: 'bold' }}>
                    Amenidades
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
                    <Button variant="contained" color="secondary" onClick={handleAgregarAmenidad} startIcon={<AddCircleOutlineIcon />} sx={{ height: '40px' }}>
                        Agregar
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, bgcolor: '#fafafa', borderRadius: '8px', minHeight: '60px', border: '1px dashed #ccc' }}>
                    {amenidades.map((tag, index) => (
                        <Chip key={index} label={tag} onDelete={() => handleBorrarAmenidad(tag)} color="primary" variant="filled" deleteIcon={<CloseIcon style={{ color: 'white' }} />} />
                    ))}
                </Box>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            3. Ubicación Exacta
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
             <Grid item xs={12} md={8}>
                {isLoaded && (
                    <Box sx={{ border: '2px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '90%' }}>
                            <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={onPlaceChanged}>
                                <input type="text" placeholder="📍 Buscar dirección..." style={{ width: '100%', height: '50px', padding: '0 20px', borderRadius: '30px', border: '1px solid #ccc', outline: 'none' }} />
                            </Autocomplete>
                        </Box>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={{ lat: parseFloat(formData.latitud), lng: parseFloat(formData.longitud) }}
                            zoom={16}
                            onLoad={onLoadMap}
                            onUnmount={onUnmountMap}
                            onClick={onMapClick}
                            options={{ mapTypeControl: false, streetViewControl: false }}
                        >
                            <MarkerF position={{ lat: parseFloat(formData.latitud), lng: parseFloat(formData.longitud) }} draggable={true} onDragEnd={onMarkerDragEnd} />
                        </GoogleMap>
                    </Box>
                )}
             </Grid>
             
             <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: '12px', height: '100%', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#1a237e' }}>
                        <MyLocationIcon sx={{ mr: 1, fontSize: 30 }} />
                        <Typography variant="h6" fontWeight="bold">Ubicación Actual</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1" fontWeight="bold">{formData.provincia || "---"}</Typography>
                    <Typography variant="body2">{formData.ciudad || "---"}</Typography>
                    <Box sx={{ mt: 3, p: 1.5, bgcolor: '#e8eaf6', borderRadius: '8px' }}>
                        <Typography variant="caption" display="block" color="textSecondary">Dirección:</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{formData.direccion_texto}</Typography>
                    </Box>
                </Paper>
             </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: '#555', borderBottom: '2px solid #eee', pb: 1 }}>
            4. Actualizar Fotos (Opcional)
          </Typography>
          <Box sx={{ mb: 3, border: '2px dashed #1976d2', borderRadius: '12px', p: 4, textAlign: 'center', bgcolor: '#e3f2fd' }}>
             <input type="file" multiple accept="image/*" onChange={onFileChange} style={{ display: 'block', margin: '0 auto', cursor: 'pointer' }} />
             <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Si subes fotos nuevas, se añadirán/reemplazarán.</Typography>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={<SaveIcon />}
            sx={{ py: 2, fontWeight: 'bold', fontSize: '1.2rem', borderRadius: '12px' }}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>

        </form>
        {mensaje && <Typography sx={{ mt: 3, color: mensaje.startsWith('Error') ? 'red' : 'green', textAlign: 'center', fontWeight: 'bold' }}>{mensaje}</Typography>}
      </Paper>
    </Box>
  );
};

export default EditarPropiedad;