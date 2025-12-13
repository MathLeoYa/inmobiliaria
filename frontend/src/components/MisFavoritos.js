// src/components/MisFavoritos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Container, CircularProgress, Alert, Button, Snackbar, Paper, Chip, IconButton
} from '@mui/material';
import { 
  Favorite, DeleteOutline, BedOutlined, BathtubOutlined, SquareFoot, WhatsApp, ArrowForward 
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const MisFavoritos = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Estados para notificación
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    
    const fetchMisFavoritos = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/favoritos/me', { 
            headers: { 'x-auth-token': token } 
        });
        
        // El backend devuelve las propiedades. Las marcamos como favoritas para el UI.
        const favoritosConFlag = res.data.map(prop => ({
            ...prop,
            is_favorited: true
        }));

        setFavoritos(favoritosConFlag);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar tus favoritos.');
      } finally { 
        setLoading(false); 
      }
    };

    fetchMisFavoritos();
  }, [token, navigate]);

  const handleRemoveFavorite = async (propiedadId) => {
    try {
      // Endpoint Toggle: Si ya es favorito y llamamos, lo quita.
      await axios.post(`http://localhost:5000/api/favoritos/${propiedadId}`, {}, { headers: { 'x-auth-token': token } });
      
      // Actualizar UI quitando la tarjeta
      setFavoritos(prev => prev.filter(p => p.id !== propiedadId));
      
      setSnackbarMsg('Propiedad eliminada de tus favoritos');
      setOpenSnackbar(true);

    } catch (err) {
      console.error(err);
      setSnackbarMsg('Error al actualizar favoritos');
      setOpenSnackbar(true);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="800" color="#1a237e" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite color="error" fontSize="large" /> Mis Propiedades Favoritas
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {!loading && favoritos.length === 0 && (
           <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
              <Typography variant="h6" color="text.secondary">No tienes favoritos guardados aún.</Typography>
              <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>Explorar Catálogo</Button>
           </Paper>
        )}

        <Grid container spacing={3}>
          {favoritos.map((prop) => (
<Grid item key={prop.id} xs={12} sm={6} md={4} lg={3} sx={{ display: 'flex' }}>              {/* --- TARJETA HORIZONTAL --- */}
              <Paper 
                elevation={3} 
                sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 }
                }}
              >
                {/* 1. IMAGEN (Izquierda) */}
                <Box sx={{ 
                    width: { xs: '100%', md: '35%' }, 
                    height: { xs: '200px', md: 'auto' },
                    minHeight: '220px',
                    position: 'relative'
                }}>
                    <img 
                        src={prop.foto_principal || 'https://via.placeholder.com/400x300'} 
                        alt={prop.titulo}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Chip 
                        label={prop.operacion} 
                        size="small" 
                        sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', fontWeight: 'bold' }} 
                    />
                </Box>

                {/* 2. CONTENIDO (Derecha) */}
                <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#333', lineHeight: 1.2 }}>
                                {prop.titulo}
                            </Typography>
                            <IconButton onClick={() => handleRemoveFavorite(prop.id)} size="small" color="error" title="Quitar de favoritos">
                                <DeleteOutline />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {prop.ciudad}, {prop.provincia}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 3, mt: 2, color: '#666' }}>
                             {prop.habitaciones > 0 && (
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                     <BedOutlined fontSize="small" /> <Typography variant="body2">{prop.habitaciones} hab</Typography>
                                 </Box>
                             )}
                             {prop.banos > 0 && (
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                     <BathtubOutlined fontSize="small" /> <Typography variant="body2">{prop.banos} baños</Typography>
                                 </Box>
                             )}
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                 <SquareFoot fontSize="small" /> <Typography variant="body2">{prop.area_m2} m²</Typography>
                             </Box>
                        </Box>
                    </Box>

                    <Box sx={{ 
                        mt: 3, pt: 2, borderTop: '1px solid #eee', 
                        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, 
                        justifyContent: 'space-between', alignItems: 'center', gap: 2 
                    }}>
                        <Typography variant="h5" fontWeight="800" sx={{ color: '#1a237e' }}>
                            {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(prop.precio)}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                            <Button 
                                variant="outlined" color="success" size="small" startIcon={<WhatsApp />}
                                // Enlace simple a detalle por ahora
                                component={Link} to={`/propiedad/${prop.id}`}
                                sx={{ flex: 1 }}
                            >
                                Contactar
                            </Button>
                            <Button 
                                variant="contained" color="primary" size="small" endIcon={<ArrowForward />}
                                component={Link} to={`/propiedad/${prop.id}`}
                                sx={{ flex: 1, fontWeight: 'bold' }}
                            >
                                Ver Más
                            </Button>
                        </Box>
                    </Box>

                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Container>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={() => setOpenSnackbar(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MisFavoritos;