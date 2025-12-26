import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Grid, CircularProgress, Alert,
  Avatar, IconButton, Container, Snackbar, Tooltip, Menu, MenuItem, 
  Dialog, DialogContent, Chip 
} from '@mui/material';
import { 
  BedOutlined, BathtubOutlined, SquareFoot, LocationOn, Favorite, FavoriteBorder,
  Share, WhatsApp, CheckCircleOutline,
  ArrowBackIosNew, ArrowForwardIos, Close, ZoomIn 
} from '@mui/icons-material';

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import PropiedadCard from './PropiedadCard'; 

// --- CONFIGURACIÓN DEL MAPA ---
const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '12px' };
const libraries = ['places']; // FUERA del componente

// --- ESTILOS FLECHAS CARRUSEL PEQUEÑO ---
const arrowStyle = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
  bgcolor: 'white', color: '#333', width: 40, height: 40, borderRadius: '50%',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '1px solid #f0f0f0',
  '&:hover': { bgcolor: '#f5f5f5', transform: 'translateY(-50%) scale(1.1)' },
  display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s ease'
};

const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
  <IconButton {...props} sx={{ ...arrowStyle, left: 15, display: currentSlide === 0 ? 'none' : 'flex' }}>
    <ArrowBackIosNew sx={{ fontSize: '18px' }} />
  </IconButton>
);

const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
  <IconButton {...props} sx={{ ...arrowStyle, right: 15 }}>
    <ArrowForwardIos sx={{ fontSize: '18px' }} />
  </IconButton>
);

// --- ESTILOS FLECHAS MODAL (PANTALLA COMPLETA) - NUEVO ---
// Usamos 'position: fixed' para que se queden pegadas a la pantalla, no a la imagen
const modalArrowStyle = {
    position: 'fixed', // Clave: fijo a la ventana
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    bgcolor: 'rgba(0,0,0,0.5)',
    width: 60, height: 60, // Más grandes
    zIndex: 1301, // Por encima de todo el modal
    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
};

const PropiedadDetalle = () => {
  const { id } = useParams();
  
  // Estados
  const [propiedad, setPropiedad] = useState(null);
  const [similares, setSimilares] = useState([]);
  const [agente, setAgente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // eslint-disable-line
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  
  // UI States
  const [openModal, setOpenModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const isShareOpen = Boolean(shareAnchorEl);
  
  const token = localStorage.getItem('token');
  const mapApiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapApiKey,
    libraries: libraries 
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/propiedades/${id}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        
        let amenidadesArray = [];
        const rawAmenidades = res.data.amenidades;
        if (Array.isArray(rawAmenidades)) {
            amenidadesArray = rawAmenidades;
        } else if (typeof rawAmenidades === 'string') {
            amenidadesArray = rawAmenidades.replace(/[{}"\\]/g, '').split(',').map(i => i.trim()).filter(i => i);
        }

        const fotosLimpio = res.data.fotos ? res.data.fotos.map(f => f.url_foto || f) : [];
        setPropiedad({ ...res.data, amenidades: amenidadesArray, fotos: fotosLimpio });
        setIsFavoritedLocal(res.data.is_favorited);

        setAgente({
          nombre: res.data.agente_nombre || "Agente Inmobiliario",
          email: res.data.agente_email,
          telefono: res.data.agente_telefono,
          foto_perfil: res.data.agente_foto_perfil,
          facebook: res.data.agente_facebook,
          instagram: res.data.agente_instagram,
          sitio_web: res.data.agente_sitio_web,
        });

        if (res.data.provincia) {
             try {
                const resSim = await axios.get(`http://localhost:5000/api/propiedades`, { params: { provincia: res.data.provincia } });
                const otras = resSim.data.filter(p => p.id !== res.data.id).slice(0, 3);
                setSimilares(otras);
             } catch (errSim) { console.warn("Error similares:", errSim); }
        }

      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la propiedad.');
      } finally {
        setLoading(false);
      }
    };
    if (id) cargarDatos();
  }, [id, token]);

  // --- HANDLERS ---
  const handleToggleFavorite = async () => {
      if (!token) { setSnackbarMsg('Inicia sesión para guardar'); setSnackbarSeverity('warning'); setOpenSnackbar(true); return; }
      const previousState = isFavoritedLocal;
      setIsFavoritedLocal(!previousState);
      try {
        const res = await axios.post(`http://localhost:5000/api/favoritos/${id}`, {}, { headers: { 'x-auth-token': token } });
        setSnackbarMsg(res.data.msg); setSnackbarSeverity('success'); setOpenSnackbar(true);
      } catch (err) { 
        setIsFavoritedLocal(previousState); setSnackbarMsg('Error conexión'); setSnackbarSeverity('error'); setOpenSnackbar(true);
      }
  };
  
  const handleSwapPhoto = (indexToSwap) => {
    if (indexToSwap === 0) return; 
    const nuevasFotos = [...propiedad.fotos];
    const tempMain = nuevasFotos[0];
    nuevasFotos[0] = nuevasFotos[indexToSwap];
    nuevasFotos[indexToSwap] = tempMain;
    setPropiedad(prev => ({ ...prev, fotos: nuevasFotos }));
  };

  const handleOpenModal = (index) => { setCurrentImageIndex(index); setOpenModal(true); };
  const handleCloseModal = () => setOpenModal(false);
  const handleNextImage = (e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % propiedad.fotos.length); };
  const handlePrevImage = (e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + propiedad.fotos.length) % propiedad.fotos.length); };

  const handleShareClick = (e) => setShareAnchorEl(e.currentTarget);
  const handleShareClose = () => setShareAnchorEl(null);
  const handleShareAction = (platform) => { setShareAnchorEl(null); }; 
  const getWhatsAppLink = () => {
    if (!agente || !agente.telefono) return '#';
    return `https://api.whatsapp.com/send?phone=${agente.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola, info sobre: ${propiedad.titulo}`)}`;
  };

  const settings = {
    dots: false, infinite: propiedad?.fotos?.length > 4, speed: 500, slidesToShow: 4, slidesToScroll: 1,
    nextArrow: <SlickArrowRight />, prevArrow: <SlickArrowLeft />,
    responsive: [ { breakpoint: 600, settings: { slidesToShow: 3 } } ]
  };

  const formattedPrice = propiedad ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(propiedad.precio) : '$0';
  const mostrarIconosHabitables = propiedad && !['Terreno', 'Camping', 'Comercial'].includes(propiedad.tipo);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!propiedad) return null;

  return (
    <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
         
         {/* --- 1. GALERÍA PRINCIPAL (NUEVO LAYOUT: 1 Grande + 4 Pequeñas) --- */}
         <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
             <Box sx={{ height: { xs: '300px', md: '500px' }, borderRadius: '12px', overflow: 'hidden', display: 'flex', gap: '8px', mb: 1 }}>
                 
                 {/* Imagen Grande (Izquierda) */}
                 <Box 
                   sx={{ flex: 3, position: 'relative', height: '100%', cursor: 'pointer', '&:hover .overlay-zoom': { opacity: 1 } }}
                   onClick={() => handleOpenModal(0)}
                 >
                     <img src={propiedad.fotos[0]} alt="Principal" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                     <Box className="overlay-zoom" sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' }}>
                        <ZoomIn sx={{ color: 'white', fontSize: 60 }} />
                     </Box>
                 </Box>
                 
                 {/* Columna Derecha (4 Miniaturas) */}
                 <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: '8px', height: '100%' }}>
                     {/* Miniaturas 1, 2 y 3 */}
                     {[1, 2, 3].map(idx => (
                         propiedad.fotos[idx] && (
                             <Box key={idx} sx={{ flex: 1, cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px' }} onClick={() => handleSwapPhoto(idx)}>
                                 <img src={propiedad.fotos[idx]} alt={`Thumb ${idx}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                             </Box>
                         )
                     ))}
                     {/* Miniatura 4 (Boton "Ver más") */}
                     {propiedad.fotos[4] ? (
                        <Box sx={{ flex: 1, cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px' }} onClick={() => handleOpenModal(4)}>
                             <img src={propiedad.fotos[4]} alt="Ver mas" style={{ width:'100%', height:'100%', objectFit:'cover', filter: 'brightness(0.7)' }} />
                             {propiedad.fotos.length > 5 && (
                                <Typography sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                                    +{propiedad.fotos.length - 5} Fotos
                                </Typography>
                             )}
                        </Box>
                     ) : ( <Box sx={{ flex: 1, bgcolor: '#f5f5f5', borderRadius: '8px' }} /> )}
                 </Box>
             </Box>
             
             {/* Carrusel inferior (Opcional) */}
             {propiedad.fotos.length > 0 && (
                <Box sx={{ px: 3, mt: 1 }}>
                    <Slider {...settings}>
                        {propiedad.fotos.map((foto, idx) => (
                            <Box key={idx} sx={{ px: 0.5, cursor: 'pointer', outline: 'none' }} onClick={() => handleSwapPhoto(idx)}>
                                <img src={foto} alt="Miniatura" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: idx === 0 ? '2px solid #1976d2' : '1px solid #eee' }} />
                            </Box>
                        ))}
                    </Slider>
                </Box>
             )}
         </Box>

         {/* --- 2. LAYOUT PRINCIPAL (8/4 Columnas) --- */}
         <Grid container spacing={4} alignItems="flex-start"> 
            
            {/* IZQUIERDA (66.6%) */}
            <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', mb: 3, border: '1px solid #e0e0e0' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>{propiedad.tipo.toUpperCase()}</Typography>
                            <Typography variant="h4" fontWeight="800" sx={{ color: '#1a237e', mt: -1 }}>{formattedPrice}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: '#555' }}>
                                <LocationOn fontSize="small" color="action" />
                                <Typography variant="body1">{propiedad.direccion_texto || `${propiedad.ciudad}, ${propiedad.provincia}`}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Favoritos"><IconButton onClick={handleToggleFavorite} sx={{ border: '1px solid #eee' }}>{isFavoritedLocal ? <Favorite color="error" /> : <FavoriteBorder />}</IconButton></Tooltip>
                            <Tooltip title="Compartir"><IconButton onClick={handleShareClick} sx={{ border: '1px solid #eee' }}><Share /></IconButton></Tooltip>
                        </Box>
                    </Box>

                    {/* Iconos */}
                    <Grid container spacing={2} sx={{ my: 3, py: 3, borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                         <Grid item xs={4} sx={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                            <SquareFoot color="primary" sx={{ fontSize: 30, mb: 0.5 }} />
                            <Typography variant="h6" fontWeight="bold">{propiedad.area_m2}</Typography>
                            <Typography variant="caption" color="text.secondary">m² Totales</Typography>
                         </Grid>
                         {mostrarIconosHabitables && (
                           <>
                             <Grid item xs={4} sx={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                                <BedOutlined color="primary" sx={{ fontSize: 30, mb: 0.5 }} />
                                <Typography variant="h6" fontWeight="bold">{propiedad.habitaciones}</Typography>
                                <Typography variant="caption" color="text.secondary">Habitaciones</Typography>
                             </Grid>
                             <Grid item xs={4} sx={{ textAlign: 'center' }}>
                                <BathtubOutlined color="primary" sx={{ fontSize: 30, mb: 0.5 }} />
                                <Typography variant="h6" fontWeight="bold">{propiedad.banos}</Typography>
                                <Typography variant="caption" color="text.secondary">Baños</Typography>
                             </Grid>
                           </>
                         )}
                    </Grid>

                    {/* Descripción y Amenidades */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Descripción</Typography>
                    <Typography variant="body1" sx={{ color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 4 }}>{propiedad.descripcion}</Typography>
                    
                    {propiedad.amenidades?.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>Lo que ofrece este lugar</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {propiedad.amenidades.map((item, idx) => (
                                    <Chip key={idx} icon={<CheckCircleOutline fontSize="small" />} label={item} variant="outlined" sx={{ borderRadius: '8px', borderColor: '#e0e0e0', bgcolor: '#fafafa', fontWeight: '500', px: 1, py: 2.5 }} />
                                ))}
                            </Box>
                        </Box>
                    )}
                    
                    {/* Mapa */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Ubicación</Typography>
                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                        {isMapLoaded ? (
                            <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: Number(propiedad.latitud), lng: Number(propiedad.longitud) }} zoom={16} options={{ mapTypeControl: true, fullscreenControl: true, streetViewControl: true }}>
                                <MarkerF position={{ lat: Number(propiedad.latitud), lng: Number(propiedad.longitud) }} />
                            </GoogleMap>
                        ) : <CircularProgress />}
                    </Box>
                </Paper>
            </Grid>

            {/* DERECHA (33.3%) - Sticky */}
            <Grid item xs={12} md={4}>
                <Box sx={{ position: 'sticky', top: 20 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Contactar Vendedor</Typography>
                        {agente && (
                            <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}>
                                    <Avatar src={agente.foto_perfil} sx={{ width: 70, height: 70, border: '1px solid #eee' }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>{agente.nombre}</Typography>
                                        <Typography variant="body2" color="text.secondary">Agente Inmobiliario</Typography>
                                    </Box>
                                </Box>
                                <Button variant="contained" fullWidth startIcon={<WhatsApp />} href={getWhatsAppLink()} target="_blank" sx={{ mb: 2, bgcolor: '#25D366', '&:hover': { bgcolor: '#1DA851' }, py: 1.5, fontWeight: 'bold', borderRadius: '10px' }}>
                                    Enviar WhatsApp
                                </Button>
                                <Button variant="outlined" fullWidth sx={{ borderRadius: '10px', py: 1.5, color: '#333', borderColor: '#ccc' }}>Ver Perfil</Button>
                            </>
                        )}
                    </Paper>
                    {similares.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#555' }}>Propiedades Similares</Typography>
                            {similares.map(sim => (
                                <Box key={sim.id} sx={{ mb: 2 }}>
                                     <PropiedadCard propiedad={sim} compact={true} onLike={()=>{}} /> 
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Grid>
         </Grid>

      </Container>
      
      {/* --- MODAL PANTALLA COMPLETA (NUEVO: Flechas Fijas a la Pantalla) --- */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="xl" 
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } }} // overflow:visible para que se vean los botones fijos
      >
        {/* Botón Cerrar FIJO */}
        <IconButton onClick={handleCloseModal} sx={{ ...modalArrowStyle, top: 40, right: 40, width: 50, height: 50, transform: 'none' }}>
            <Close fontSize="large" />
        </IconButton>

        {/* Flecha Izquierda FIJA */}
        <IconButton onClick={handlePrevImage} sx={{ ...modalArrowStyle, left: 40 }}>
            <ArrowBackIosNew sx={{ fontSize: 30 }} />
        </IconButton>

        {/* Flecha Derecha FIJA */}
        <IconButton onClick={handleNextImage} sx={{ ...modalArrowStyle, right: 40 }}>
            <ArrowForwardIos sx={{ fontSize: 30 }} />
        </IconButton>

        {/* Contenido de la Imagen */}
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}> {/* pointerEvents: none para que los clicks pasen a las flechas fijas si es necesario */}
            <img 
                src={propiedad.fotos[currentImageIndex]} 
                alt="Full size" 
                style={{ 
                    maxHeight: '90vh', 
                    maxWidth: '90vw', 
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', // Sombra para resaltar la imagen
                    pointerEvents: 'auto' // Reactivamos eventos solo en la imagen
                }} 
            />
        </DialogContent>
      </Dialog>

      <Menu anchorEl={shareAnchorEl} open={isShareOpen} onClose={handleShareClose}><MenuItem onClick={() => handleShareAction('whatsapp')}>WhatsApp</MenuItem></Menu>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}><Alert severity={snackbarSeverity}>{snackbarMsg}</Alert></Snackbar>
    </Box>
  );
};

export default PropiedadDetalle;