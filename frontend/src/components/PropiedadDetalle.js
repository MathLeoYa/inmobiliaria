// src/components/PropiedadDetalle.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Grid, CircularProgress, Alert,
  Avatar, Divider, Chip, IconButton, Container, TextField, Snackbar, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import { 
  BedOutlined, BathtubOutlined, SquareFoot, LocationOn, Favorite, FavoriteBorder,
  Share, WhatsApp, Facebook, Instagram, Language, Email, CheckCircleOutline, PhotoLibrary,
  ContentCopy, Twitter, ArrowForward // <-- ASEGURATE DE QUE ESTE ESTÉ AQUÍ
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Importar el componente de tarjeta para las recomendaciones
import PropiedadCard from './PropiedadCard'; 

// Fix iconos Leaflet
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ 
  iconUrl: iconMarker, 
  shadowUrl: iconShadow, 
  iconAnchor: [12, 41] 
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { if(center) map.setView(center, 15); }, [center, map]);
  return <Marker position={center} />;
}

const PropiedadDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [propiedad, setPropiedad] = useState(null);
  const [similares, setSimilares] = useState([]); // <-- Estado para similares
  const [agente, setAgente] = useState(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  
  // Estados para compartir y notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const isShareOpen = Boolean(shareAnchorEl);
  
  const token = localStorage.getItem('token');

  // --- 1. Cargar Propiedad y Similares ---
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // A. Cargar Propiedad Principal
        const res = await axios.get(`http://localhost:5000/api/propiedades/${id}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        
        // Normalizar datos
        let amenidadesArray = [];
        if (res.data.amenidades) {
            if (Array.isArray(res.data.amenidades)) amenidadesArray = res.data.amenidades;
            else if (typeof res.data.amenidades === 'string') amenidadesArray = res.data.amenidades.replace('{','').replace('}','').replace(/"/g,'').split(',');
        }
        const fotosLimpio = res.data.fotos ? res.data.fotos.map(f => f.url_foto || f) : [];

        setPropiedad({ ...res.data, amenidades: amenidadesArray, fotos: fotosLimpio });
        setIsFavoritedLocal(res.data.is_favorited);

        setAgente({
          nombre: res.data.agente_nombre || "Agente Inmobiliario",
          email: res.data.agente_email,
          telefono: res.data.agente_telefono,
          foto_perfil: res.data.agente_foto_perfil,
          biografia: res.data.agente_biografia,
          facebook: res.data.agente_facebook,
          instagram: res.data.agente_instagram,
          sitio_web: res.data.agente_sitio_web,
          logo_url: res.data.agente_logo_url 
        });

        // B. Cargar Similares (si hay provincia)
        if (res.data.provincia) {
             try {
                const resSim = await axios.get(`http://localhost:5000/api/propiedades`, {
                    params: { provincia: res.data.provincia } 
                });
                // Filtrar la actual y tomar max 4
                const otras = resSim.data.filter(p => p.id !== res.data.id).slice(0, 4);
                setSimilares(otras);
             } catch (errSim) {
                 console.warn("Error cargando similares (no crítico):", errSim);
             }
        }

      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la propiedad.');
      } finally {
        // C. IMPORTANTE: Terminar carga pase lo que pase
        setLoading(false);
      }
    };

    if (id) cargarDatos();
  }, [id, token]);

  // --- Funciones de Interacción ---

  const handleToggleFavorite = async () => {
    if (!token) { 
        setSnackbarMsg('Inicia sesión para guardar en favoritos');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return; 
    }
    const previousState = isFavoritedLocal;
    setIsFavoritedLocal(!previousState);
    try {
      const res = await axios.post(`http://localhost:5000/api/favoritos/${id}`, {}, { headers: { 'x-auth-token': token } });
      setSnackbarMsg(res.data.msg);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (err) { 
      setIsFavoritedLocal(previousState);
      setSnackbarMsg('Error al conectar con el servidor');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Like para las tarjetas similares (reusa la lógica simple)
  const handleLikeSimilar = async (propId) => {
      if (!token) { navigate('/login'); return; }
      try { 
          await axios.post(`http://localhost:5000/api/favoritos/${propId}`, {}, { headers: { 'x-auth-token': token } }); 
      } catch(e) {}
  };

  const handleSwapPhoto = (indexToSwap) => {
    if (indexToSwap === 0) return; 
    const nuevasFotos = [...propiedad.fotos];
    const tempMain = nuevasFotos[0];
    nuevasFotos[0] = nuevasFotos[indexToSwap];
    nuevasFotos[indexToSwap] = tempMain;
    setPropiedad(prev => ({ ...prev, fotos: nuevasFotos }));
  };

  // Compartir
  const handleShareClick = (event) => setShareAnchorEl(event.currentTarget);
  const handleShareClose = () => setShareAnchorEl(null);
  const handleShareAction = (platform) => {
    handleShareClose();
    const shareUrl = window.location.href;
    const shareText = `Mira esta propiedad en EliteHomes: ${propiedad.titulo}`;
    let url = '';
    switch (platform) {
        case 'whatsapp': url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`; window.open(url, '_blank'); break;
        case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`; window.open(url, '_blank'); break;
        case 'twitter': url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`; window.open(url, '_blank'); break;
        case 'copy': navigator.clipboard.writeText(shareUrl).then(() => { setSnackbarMsg('Enlace copiado'); setSnackbarSeverity('success'); setOpenSnackbar(true); }); break;
        default: break;
    }
  };

  const getWhatsAppLink = () => {
      if (!agente || !agente.telefono) return '#';
      const telefono = agente.telefono.replace(/\D/g, '');
      const mensaje = `Hola ${agente.nombre}, estoy interesado en la propiedad "${propiedad.titulo}"...`;
      return `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
  };

  // Datos calculados
  const formattedPrice = propiedad ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(propiedad.precio) : '$0';
  const mapPosition = [propiedad?.latitud || -4.0080, propiedad?.longitud || -79.2045];
  const mostrarIconosHabitables = propiedad && !['Terreno', 'Camping', 'Comercial'].includes(propiedad.tipo);
  const settings = { dots: false, infinite: false, speed: 500, slidesToShow: 5, slidesToScroll: 1, responsive: [{ breakpoint: 1024, settings: { slidesToShow: 4 } }, { breakpoint: 600, settings: { slidesToShow: 3 } }] };

  // --- Renderizado ---
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 5, textAlign: 'center' }}><Alert severity="error">{error}</Alert></Box>;
  if (!propiedad) return null;

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', pb: 8, pt: { xs: 2, md: 4 } }}>
      
      {/* GALERÍA */}
      <Container maxWidth="xl" sx={{ mb: 6 }}>
         <Box sx={{ height: { xs: '300px', md: '500px' }, borderRadius: '16px', overflow: 'hidden', display: 'flex', gap: '8px' }}>
             <Box sx={{ flex: 2, position: 'relative', height: '100%' }}>
                 <img src={propiedad.fotos[0]} alt="Principal" style={{ width:'100%', height:'100%', objectFit:'cover', cursor: 'default' }} />
             </Box>
             <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexWrap: 'wrap', gap: '8px', height: '100%' }}>
                 {[1, 2, 3, 4].map(idx => (
                     propiedad.fotos[idx] ? (
                         <Box key={idx} sx={{ width: 'calc(50% - 4px)', height: 'calc(50% - 4px)', cursor: 'pointer', position: 'relative' }} onClick={() => handleSwapPhoto(idx)}>
                             <img src={propiedad.fotos[idx]} alt={`Mosaico ${idx}`} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius: '4px', transition: '0.2s opacity' }} onMouseOver={(e) => e.currentTarget.style.opacity = 0.8} onMouseOut={(e) => e.currentTarget.style.opacity = 1} />
                             {idx === 4 && propiedad.fotos.length > 5 && <Button variant="contained" startIcon={<PhotoLibrary />} sx={{ position: 'absolute', bottom: 15, right: 15, bgcolor: 'white', color: 'black', fontWeight: 'bold', pointerEvents: 'none' }}>+{propiedad.fotos.length - 5}</Button>}
                         </Box>
                      ) : ( <Box key={idx} sx={{ width: 'calc(50% - 4px)', height: 'calc(50% - 4px)', bgcolor: '#f5f5f5', borderRadius: '4px' }} /> )
                 ))}
             </Box>
         </Box>
         {propiedad.fotos.length > 5 && (
            <Box sx={{ mt: 2, px: 2 }}>
                <Slider {...settings}>
                    {propiedad.fotos.slice(5).map((foto, idx) => (
                        <Box key={idx + 5} sx={{ px: 0.5, cursor: 'pointer' }} onClick={() => handleSwapPhoto(idx + 5)}>
                            <img src={foto} alt="Extra" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        </Box>
                    ))}
                </Slider>
            </Box>
         )}
      </Container>

      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          
          {/* IZQUIERDA */}
          <Grid item xs={12} md={7}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{propiedad.tipo} en {propiedad.ciudad}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a237e' }}>{propiedad.operacion} desde {formattedPrice}</Typography>
                <Box sx={{ ml: 4, display: 'flex', gap: 1 }}>
                    <Tooltip title="Favoritos"><IconButton onClick={handleToggleFavorite} sx={{ border: '1px solid #eee', color: isFavoritedLocal ? '#FF4500' : 'inherit', bgcolor: isFavoritedLocal ? '#fff0f0' : 'transparent' }}>{isFavoritedLocal ? <Favorite /> : <FavoriteBorder />}</IconButton></Tooltip>
                    <Tooltip title="Compartir"><IconButton onClick={handleShareClick} sx={{ border: '1px solid #eee' }}><Share /></IconButton></Tooltip>
                    <Menu anchorEl={shareAnchorEl} open={isShareOpen} onClose={handleShareClose}>
                        <MenuItem onClick={() => handleShareAction('whatsapp')}><ListItemIcon><WhatsApp sx={{ color: '#25D366' }} /></ListItemIcon><ListItemText>WhatsApp</ListItemText></MenuItem>
                        <MenuItem onClick={() => handleShareAction('facebook')}><ListItemIcon><Facebook sx={{ color: '#1877F2' }} /></ListItemIcon><ListItemText>Facebook</ListItemText></MenuItem>
                        <MenuItem onClick={() => handleShareAction('copy')}><ListItemIcon><ContentCopy /></ListItemIcon><ListItemText>Copiar Enlace</ListItemText></MenuItem>
                    </Menu>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#333', mb: 4 }}><LocationOn fontSize="small" /><Typography fontWeight="500">{propiedad.direccion_texto || `${propiedad.ciudad}, ${propiedad.provincia}`}</Typography></Box>
            <Divider />
            
            <Box sx={{ py: 3, display: 'flex', flexWrap: 'wrap', gap: { xs: 3, md: 6 }, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><SquareFoot sx={{ fontSize: 28, color: '#333' }} /><Typography variant="body1" fontWeight="500">{propiedad.area_m2} m² tot.</Typography></Box>
                {mostrarIconosHabitables && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><BedOutlined sx={{ fontSize: 28, color: '#333' }} /><Typography variant="body1" fontWeight="500">{propiedad.habitaciones} hab.</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><BathtubOutlined sx={{ fontSize: 28, color: '#333' }} /><Typography variant="body1" fontWeight="500">{propiedad.banos} baños</Typography></Box>
                  </>
                )}
            </Box>
            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>Descripción</Typography>
            <Typography variant="body1" sx={{ color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', mb: 4 }}>{propiedad.descripcion}</Typography>
            {propiedad.amenidades && propiedad.amenidades.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Amenidades</Typography>
                    <Grid container spacing={1}>
                        {propiedad.amenidades.map((item, idx) => (<Grid item xs={6} sm={4} key={idx}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleOutline color="success" fontSize="small" /><Typography variant="body2">{item}</Typography></Box></Grid>))}
                    </Grid>
                </Box>
            )}
            
            <Typography variant="h6" fontWeight="bold" gutterBottom>Ubicación</Typography>
            <Box sx={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0', mb: 6 }}>
                 <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapController center={mapPosition} /></MapContainer>
            </Box>

            {/* --- SECCIÓN DE SIMILARES --- */}
            {similares.length > 0 && (
                <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #eee' }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#333', mb: 3 }}>
                        Otras propiedades en {propiedad.provincia}
                    </Typography>
                    <Grid container spacing={3}>
                        {similares.map(sim => (
                            <Grid item key={sim.id} xs={12} sm={6}> 
                                <PropiedadCard propiedad={sim} onLike={handleLikeSimilar} />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Button variant="outlined" endIcon={<ArrowForward />} onClick={() => navigate('/')} sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: '20px', px: 4 }}>
                            Ver todo el catálogo
                        </Button>
                    </Box>
                </Box>
            )}

          </Grid>

          {/* DERECHA */}
          <Grid item xs={12} md={4}>
             <Box sx={{ position: 'sticky', top: 100 }}>
                <Paper elevation={3} sx={{ borderRadius: '16px', p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Contactar al Vendedor</Typography>
                    {agente && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                            <Avatar src={agente.foto_perfil} sx={{ width: 64, height: 64, border: '2px solid #eee' }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.1}>{agente.nombre}</Typography>
                                <Typography variant="caption" color="text.secondary">Agente Inmobiliario</Typography>
                            </Box>
                        </Box>
                        <Button variant="contained" fullWidth startIcon={<WhatsApp />} href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" sx={{ mb: 1, bgcolor: '#25D366', '&:hover': { bgcolor: '#1DA851' }, py: 1.5, fontWeight: 'bold' }}>WhatsApp</Button>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            {agente.facebook && <Tooltip title="Facebook"><IconButton href={agente.facebook} target="_blank" rel="noopener noreferrer" sx={{ color: '#1877F2', bgcolor: '#eaf4ff' }}><Facebook /></IconButton></Tooltip>}
                            {agente.instagram && <Tooltip title="Instagram"><IconButton href={agente.instagram} target="_blank" rel="noopener noreferrer" sx={{ color: '#E4405F', bgcolor: '#ffeef2' }}><Instagram /></IconButton></Tooltip>}
                            {agente.sitio_web && <Tooltip title="Web"><IconButton href={agente.sitio_web} target="_blank" rel="noopener noreferrer" sx={{ color: '#333', bgcolor: '#f5f5f5' }}><Language /></IconButton></Tooltip>}
                        </Box>
                      </>
                    )}
                </Paper>
             </Box>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMsg}</Alert></Snackbar>
    </Box>
  );
};

export default PropiedadDetalle;