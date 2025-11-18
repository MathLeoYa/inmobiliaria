// src/components/PropiedadDetalle.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Grid, CircularProgress, Alert,
  Avatar, Divider, Chip, IconButton, Container, TextField, Snackbar, Tooltip
} from '@mui/material';
import { 
  BedOutlined, BathtubOutlined, SquareFoot, LocationOn, Favorite, FavoriteBorder,
  Share, WhatsApp, Facebook, Instagram, Language, Email, CheckCircleOutline, PhotoLibrary,ArrowBackIosNew, ArrowForwardIos
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
// --- COMPONENTES DE FLECHAS PERSONALIZADAS ---
function SampleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'absolute',
        right: '-20px', // La sacamos un poco a la derecha
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        backgroundColor: 'white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        '&:hover': { backgroundColor: '#f0f0f0' },
        display: { xs: 'none', md: 'flex' } // Ocultar en móvil si se prefiere swipe
      }}
    >
      <ArrowForwardIos fontSize="small" sx={{ color: '#333' }} />
    </IconButton>
  );
}

function SamplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'absolute',
        left: '-20px', // La sacamos un poco a la izquierda
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
        backgroundColor: 'white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        '&:hover': { backgroundColor: '#f0f0f0' },
        display: { xs: 'none', md: 'flex' }
      }}
    >
      <ArrowBackIosNew fontSize="small" sx={{ color: '#333' }} />
    </IconButton>
  );
}

const PropiedadDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  const [agente, setAgente] = useState(null);
  
  // Estados para notificación
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPropiedad = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/propiedades/${id}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        
        let amenidadesArray = [];
        if (res.data.amenidades) {
            if (Array.isArray(res.data.amenidades)) {
              amenidadesArray = res.data.amenidades;
            } else if (typeof res.data.amenidades === 'string') {
              amenidadesArray = res.data.amenidades.replace('{','').replace('}','').replace(/"/g,'').split(',');
            }
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
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la propiedad.');
        setLoading(false);
      }
    };
    fetchPropiedad();
  }, [id, token]);

  // --- FUNCIÓN FAVORITOS CORREGIDA (SOLO POST TOGGLE) ---
  const handleToggleFavorite = async () => {
    if (!token) { 
        setSnackbarMsg('Inicia sesión para guardar en favoritos');
        setSnackbarSeverity('warning');
        setOpenSnackbar(true);
        return; 
    }
    
    // Actualización Optimista
    const previousState = isFavoritedLocal;
    setIsFavoritedLocal(!previousState);

    try {
      // Usamos siempre el mismo endpoint. El backend se encarga de activar/desactivar.
      const res = await axios.post(
          `http://localhost:5000/api/favoritos/${id}`, 
          {}, // Body vacío
          { headers: { 'x-auth-token': token } }
      );
      
      // Mensaje del backend ("Añadido..." o "Quitado...")
      setSnackbarMsg(res.data.msg);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
    } catch (err) { 
      console.error(err);
      setIsFavoritedLocal(previousState); // Revertir si falla
      setSnackbarMsg('Error al conectar con el servidor');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
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

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbarMsg('¡Enlace copiado al portapapeles!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    }).catch(err => console.error(err));
  };

  // Link de WhatsApp personalizado
  const getWhatsAppLink = () => {
      if (!agente || !agente.telefono) return '#';
      const telefono = agente.telefono.replace(/\D/g, '');
      const mensaje = `Hola ${agente.nombre}, estoy interesado en la propiedad "${propiedad.titulo}" que vi en EliteHomes. ¿Podría darme más información?`;
      return `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
  };

  const formattedPrice = propiedad ? new Intl.NumberFormat('es-EC', { 
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(propiedad.precio) : '$0';

  const mapPosition = [propiedad?.latitud || -4.0080, propiedad?.longitud || -79.2045];
  const mostrarIconosHabitables = propiedad && !['Terreno', 'Camping', 'Comercial'].includes(propiedad.tipo);
  
  const settings = {
    dots: false,
    infinite: false, // Si tienes muchas fotos, podrías poner true
    speed: 500,
    slidesToShow: 5, // Cuántas fotos se ven a la vez
    slidesToScroll: 1,
    nextArrow: <SampleNextArrow />, // Flecha derecha personalizada
    prevArrow: <SamplePrevArrow />, // Flecha izquierda personalizada
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 600, settings: { slidesToShow: 3 } }
    ]
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 5, textAlign: 'center' }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ bgcolor: 'white',margin: '80px auto 40px auto', minHeight: '100vh', pb: 8, pt: { xs: 2, md: 4 } }}>
      
      {/* GALERÍA MOSAICO */}
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
                             {idx === 4 && propiedad.fotos.length > 5 && (
                                <Button variant="contained" startIcon={<PhotoLibrary />} sx={{ position: 'absolute', bottom: 15, right: 15, bgcolor: 'white', color: 'black', fontWeight: 'bold', pointerEvents: 'none' }}>+{propiedad.fotos.length - 5}</Button>
                             )}
                         </Box>
                      ) : (
                         <Box key={idx} sx={{ width: 'calc(50% - 4px)', height: 'calc(50% - 4px)', bgcolor: '#f5f5f5', borderRadius: '4px' }} />
                      )
                 ))}
             </Box>
         </Box>
         {propiedad.fotos.length > 5 && (
            <Box sx={{ mt: 2, px: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#666' }}>Más fotos:</Typography>
                <Slider {...settings}>
                    {propiedad.fotos.slice(5).map((foto, indexRelativo) => {
                        const indexReal = indexRelativo + 5;
                        return (
                            <Box key={indexReal} sx={{ px: 1, cursor: 'pointer' }} onClick={() => handleSwapPhoto(indexReal)}>
                                <img src={foto} alt={`Extra ${indexReal}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid transparent' }} onMouseOver={(e) => e.currentTarget.style.border = '2px solid #1a237e'} onMouseOut={(e) => e.currentTarget.style.border = '2px solid transparent'} />
                            </Box>
                        );
                    })}
                </Slider>
            </Box>
         )}
      </Container>

      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          
          {/* IZQUIERDA: DETALLES */}
          <Grid item xs={12} md={7}>
            {/* Header Info */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {propiedad.tipo} en {propiedad.ciudad}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a237e' }}>
                  {propiedad.operacion} desde {formattedPrice}
                </Typography>
                <Box sx={{ ml: 4, display: 'flex', gap: 1 }}>
                    <Tooltip title={isFavoritedLocal ? "Quitar de favoritos" : "Guardar en favoritos"}>
                        <IconButton onClick={handleToggleFavorite} sx={{ border: '1px solid #eee', color: isFavoritedLocal ? '#FF4500' : 'inherit', bgcolor: isFavoritedLocal ? '#fff0f0' : 'transparent' }}>
                            {isFavoritedLocal ? <Favorite /> : <FavoriteBorder />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Compartir">
                        <IconButton onClick={handleShare} sx={{ border: '1px solid #eee' }}><Share /></IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#333', mb: 4 }}>
              <LocationOn fontSize="small" />
              <Typography fontWeight="500">{propiedad.direccion_texto || `${propiedad.ciudad}, ${propiedad.provincia}`}</Typography>
            </Box>
            <Divider />
            
            {/* Métricas */}
            <Box sx={{ py: 3, display: 'flex', flexWrap: 'wrap', gap: { xs: 3, md: 6 }, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SquareFoot sx={{ fontSize: 28, color: '#333' }} />
                    <Typography variant="body1" fontWeight="500">{propiedad.area_m2} m² tot.</Typography>
                </Box>
                {mostrarIconosHabitables && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BedOutlined sx={{ fontSize: 28, color: '#333' }} />
                        <Typography variant="body1" fontWeight="500">{propiedad.habitaciones} hab.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BathtubOutlined sx={{ fontSize: 28, color: '#333' }} />
                        <Typography variant="body1" fontWeight="500">{propiedad.banos} baños</Typography>
                    </Box>
                  </>
                )}
            </Box>
            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>Descripción</Typography>
            <Typography variant="body1" sx={{ color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap', mb: 4 }}>
               {propiedad.descripcion}
            </Typography>

            {propiedad.amenidades && propiedad.amenidades.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Amenidades</Typography>
                    <Grid container spacing={1}>
                        {propiedad.amenidades.map((item, idx) => (
                            <Grid item xs={6} sm={4} key={idx}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleOutline color="success" fontSize="small" /><Typography variant="body2">{item}</Typography></Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
            <Typography variant="h6" fontWeight="bold" gutterBottom>Ubicación</Typography>
            <Box sx={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                 <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <MapController center={mapPosition} />
                 </MapContainer>
            </Box>
          </Grid>

          {/* DERECHA: TARJETA VENDEDOR (Sticky) */}
          <Grid item xs={12} md={4}>
             <Box sx={{ position: 'sticky', top: 100 }}>
                <Paper elevation={3} sx={{ borderRadius: '16px', p: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Contactar al Vendedor
                    </Typography>
                    
                    {agente && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                            <Avatar src={agente.foto_perfil} sx={{ width: 64, height: 64, border: '2px solid #eee' }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.1}>
                                    {agente.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Agente Inmobiliario
                                </Typography>
                            </Box>
                        </Box>

                        {/* Botón WhatsApp Mejorado */}
                        <Button 
                            variant="contained" 
                            fullWidth 
                            startIcon={<WhatsApp />} 
                            href={getWhatsAppLink()}
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ bgcolor: '#25D366', color: 'white', fontWeight: 'bold', py: 1.5, borderRadius: '8px', mb: 2, '&:hover': { bgcolor: '#1DA851' } }}
                        >
                            WhatsApp
                        </Button>
                        
                        {/* Redes Sociales con Iconos */}
                        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 1, mt: 2 }}>
                            O visita sus redes:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                             {/* Facebook */}
                             <Tooltip title={agente.facebook ? "Facebook" : "No disponible"}>
                                <span>
                                    <IconButton 
                                        href={agente.facebook} target="_blank" rel="noopener noreferrer"
                                        disabled={!agente.facebook}
                                        sx={{ color: '#1877F2', bgcolor: '#eaf4ff', '&:hover': { bgcolor: '#d4e9ff' }, '&.Mui-disabled': { opacity: 0.5 } }}
                                    >
                                        <Facebook fontSize="medium" />
                                    </IconButton>
                                </span>
                             </Tooltip>

                             {/* Instagram */}
                             <Tooltip title={agente.instagram ? "Instagram" : "No disponible"}>
                                <span>
                                    <IconButton 
                                        href={agente.instagram} target="_blank" rel="noopener noreferrer"
                                        disabled={!agente.instagram}
                                        sx={{ color: '#E4405F', bgcolor: '#ffeef2', '&:hover': { bgcolor: '#ffd6df' }, '&.Mui-disabled': { opacity: 0.5 } }}
                                    >
                                        <Instagram fontSize="medium" />
                                    </IconButton>
                                </span>
                             </Tooltip>

                             {/* Web */}
                             <Tooltip title={agente.sitio_web ? "Sitio Web" : "No disponible"}>
                                <span>
                                    <IconButton 
                                        href={agente.sitio_web} target="_blank" rel="noopener noreferrer"
                                        disabled={!agente.sitio_web}
                                        sx={{ color: '#333', bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#e0e0e0' }, '&.Mui-disabled': { opacity: 0.5 } }}
                                    >
                                        <Language fontSize="medium" />
                                    </IconButton>
                                </span>
                             </Tooltip>
                        </Box>
                      </>
                    )}
                </Paper>
             </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropiedadDetalle;