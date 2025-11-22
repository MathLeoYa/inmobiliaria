// src/components/Catalogo.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { 
  Box, Typography, Paper, Button, TextField, Grid, Select, MenuItem, 
  FormControl, InputLabel, Snackbar, Alert, Container
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PropiedadCard from './PropiedadCard'; 

const Catalogo = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState({
    operacion: 'Venta',
    provinciaId: '', 
    provinciaNombre: '', 
    ciudadNombre: '',
    tipo: 'Cualquiera',
    precioMin: '',
    precioMax: '',
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const resProv = await axios.get('http://localhost:5000/api/locations/provincias');
        setProvincias(resProv.data);
        fetchPropiedades(); 
      } catch (err) { console.error(err); }
    };
    initData();
  }, []);

  useEffect(() => {
    if (filtros.provinciaId) {
      axios.get(`http://localhost:5000/api/locations/cantones/${filtros.provinciaId}`)
        .then(res => setCantones(res.data))
        .catch(err => console.error(err));
    } else {
      setCantones([]);
    }
  }, [filtros.provinciaId]);

  const fetchPropiedades = async (filtrosActivos = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'x-auth-token': token } : {}; 

      const params = new URLSearchParams();
      if (filtrosActivos) {
        params.append('operacion', filtrosActivos.operacion);
        if (filtrosActivos.provinciaNombre) params.append('provincia', filtrosActivos.provinciaNombre);
        if (filtrosActivos.ciudadNombre) params.append('ciudad', filtrosActivos.ciudadNombre);
        if (filtrosActivos.tipo !== 'Cualquiera') params.append('tipo', filtrosActivos.tipo);
        if (filtrosActivos.precioMin) params.append('precioMin', filtrosActivos.precioMin);
        if (filtrosActivos.precioMax) params.append('precioMax', filtrosActivos.precioMax);
        
      }
      const res = await axios.get(`http://localhost:5000/api/propiedades?${params.toString()}`, { headers });
      setPropiedades(res.data);
      if (res.data.length === 0 && filtrosActivos) {
        setSnackbarMsg('No se encontraron propiedades con esos filtros.');
        setOpenSnackbar(true);
      }
    } catch (err) { 
      setSnackbarMsg('Error al conectar con el servidor.');
      setOpenSnackbar(true);
      console.error(err); 
    }
    setLoading(false);
  };

  const handleOperacionChange = (e, newVal) => { if (newVal) setFiltros(prev => ({ ...prev, operacion: newVal })); };
  
  const handleProvinciaChange = (e) => {
    const id = e.target.value;
    if (!id) { setFiltros(prev => ({ ...prev, provinciaId: '', provinciaNombre: '', ciudadNombre: '' })); return; }
    const nombre = provincias.find(p => p.id === id)?.nombre || '';
    setFiltros(prev => ({ ...prev, provinciaId: id, provinciaNombre: nombre, ciudadNombre: '' }));
  };

  const handleGenericoChange = (e) => { setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleLike = async (propiedadId) => {
    const token = localStorage.getItem('token');
    if (!token) { setSnackbarMsg('Inicia sesión para guardar favoritos'); setOpenSnackbar(true); return; }
    try { 
      await axios.post(`http://localhost:5000/api/favoritos/${propiedadId}`, {}, { headers: { 'x-auth-token': token } }); 
      setSnackbarMsg('Favoritos actualizado'); 
      setOpenSnackbar(true);
      // Opcional: Re-fetch para que las tarjetas se actualicen con el nuevo estado de favoritos
      // fetchPropiedades(filtros); 
    } catch (err) { 
      setSnackbarMsg('Error al actualizar favoritos.');
      setOpenSnackbar(true);
      console.error(err); 
    }
  };

  return (
    <Box>
      {/* --- HERO SECTION MODERNA --- */}
      <Box sx={{
        height: '80vh', // Más alto para el efecto visual
        minHeight: '650px',
        backgroundImage: 'url(/hero-background.jpg)', // Asegúrate de tener una buena imagen en public/
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pb: '100px' // Espacio para que la caja de filtros se "solape"
      }}>
        {/* Overlay degradado sutil */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)'
        }} />

        {/* Contenido del Hero (texto) */}
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'white' }}>
          <Typography variant="h2" component="h1" sx={{ 
            fontWeight: 800, 
            mb: 2, 
            textShadow: '0px 4px 12px rgba(0,0,0,0.4)',
            fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4.5rem' }
          }}>
            Encuentra el hogar de tus sueños
          </Typography>
          <Typography variant="h5" sx={{ 
            mb: 6, 
            fontWeight: 400, 
            maxWidth: '700px', 
            mx: 'auto',
            textShadow: '0px 2px 8px rgba(0,0,0,0.3)',
            fontSize: { xs: '1.2rem', sm: '1.5rem' }
          }}>
            Explora una amplia selección de propiedades exclusivas en las mejores ubicaciones de Ecuador.
          </Typography>

        </Container>
      </Box> {/* Fin Hero Section */}
      
      {/* --- CAJA DE FILTROS FLOTANTE DEBAJO DEL HERO --- */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 3, // Asegura que esté sobre otras cosas
        mt: -12, // Mueve la caja hacia arriba para que se solape con el hero
        mb: 8, // Margen inferior para separar de las propiedades
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Paper elevation={12} sx={{
          width: '90%', 
          maxWidth: '1200px', // Un poco más ancha para más espacio
          borderRadius: '16px', // Bordes redondeados
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0px 10px 40px rgba(0,0,0,0.15)', // Sombra más pronunciada
          p: 0 // Padding controlado internamente
        }}>
          {/* Pestañas (Venta / Arriendo) */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
            {['Venta', 'Arriendo'].map((opcion) => (
              <Box
                key={opcion}
                onClick={() => setFiltros(prev => ({ ...prev, operacion: opcion }))}
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  color: filtros.operacion === opcion ? '#1a237e' : '#888',
                  backgroundColor: filtros.operacion === opcion ? 'white' : '#fcfcfc',
                  borderBottom: filtros.operacion === opcion ? '3px solid #1a237e' : 'none',
                  transition: 'all 0.3s ease-out'
                }}
              >
                {opcion}
              </Box>
            ))}
          </Box>

          {/* Fila de Inputs */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
              
              {/* Provincia */}
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Provincia</InputLabel>
                  <Select value={filtros.provinciaId} label="Provincia" onChange={handleProvinciaChange}>
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {provincias.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Cantón */}
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth variant="outlined" size="small" disabled={!filtros.provinciaId}>
                  <InputLabel>Ciudad / Cantón</InputLabel>
                  <Select name="ciudadNombre" value={filtros.ciudadNombre} label="Ciudad / Cantón" onChange={handleGenericoChange}>
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {cantones.map(c => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tipo */}
              <Grid item xs={12} sm={6} md={2}>
                 <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select name="tipo" value={filtros.tipo} label="Tipo" onChange={handleGenericoChange}>
                       <MenuItem value="Cualquiera">Todos</MenuItem>
                       <MenuItem value="Casa">Casa</MenuItem>
                       <MenuItem value="Apartamento">Departamento</MenuItem>
                       <MenuItem value="Terreno">Terreno</MenuItem>
                       <MenuItem value="Comercial">Comercial</MenuItem>
                    </Select>
                 </FormControl>
              </Grid>

              {/* Precio Min */}
              <Grid item xs={6} sm={3} md={1.5}>
                 <TextField 
                   label="Precio Mín" 
                   name="precioMin" 
                   type="number" 
                   variant="outlined" 
                   size="small" 
                   fullWidth 
                   onChange={handleGenericoChange} 
                 />
              </Grid>
              {/* Precio Max */}
              <Grid item xs={6} sm={3} md={1.5}>
                 <TextField 
                   label="Precio Máx" 
                   name="precioMax" 
                   type="number" 
                   variant="outlined" 
                   size="small" 
                   fullWidth 
                   onChange={handleGenericoChange} 
                 />
              </Grid>

              {/* Botón Buscar */}
              <Grid item xs={12} md={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  fullWidth 
                  startIcon={<SearchIcon />} 
                  onClick={() => fetchPropiedades(filtros)}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    boxShadow: '0 4px 15px rgba(26, 35, 126, 0.3)',
                    backgroundColor: '#1a237e',
                    '&:hover': { backgroundColor: '#0d1a6b' }
                  }}
                >
                  Buscar
                </Button>
              </Grid>

            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* --- RESULTADOS DE PROPIEDADES --- */}
      <Container maxWidth="xl" sx={{ py: 6, bgcolor: '#fbfbfb' }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 4, color: '#333', textAlign: 'center' }}>
          Propiedades en Venta y Arriendo
        </Typography>
        
        {loading ? (
          <Typography sx={{ textAlign: 'center', py: 5 }}>Cargando propiedades...</Typography>
        ) : propiedades.length === 0 ? (
          <Typography sx={{ textAlign: 'center', py: 5, color: '#555' }}>
            No encontramos propiedades que coincidan con tus criterios. Intenta con otros filtros.
          </Typography>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {propiedades.map((prop) => (
              <Grid item key={prop.id} xs={12} sm={6} md={4} lg={3}>
                <PropiedadCard propiedad={prop} onLike={handleLike} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      
      {/* NOTIFICACIÓN (Snackbar) */}
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%' }}>{snackbarMsg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Catalogo;