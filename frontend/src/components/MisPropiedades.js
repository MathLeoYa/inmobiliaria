import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button, 
  IconButton, Chip, Paper, CircularProgress, Alert 
} from '@mui/material';
import { 
  ReportProblem, WhatsApp, Edit, Delete, AddHome 
} from '@mui/icons-material';

const MisPropiedades = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState({ type: '', text: '' }); // Mejor manejo de mensajes
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');
  const [isSuspended, setIsSuspended] = useState(false);
  const [telefonoAdmin, setTelefonoAdmin] = useState('');

  useEffect(() => {
    // Obtener teléfono del admin
    axios.get('http://localhost:5000/api/configuracion')
      .then(res => setTelefonoAdmin(res.data.telefono_admin_whatsapp))
      .catch(err => console.error(err));

    if (!token) { navigate('/login'); return; }

    const fetchMisPropiedades = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/propiedades/me', {
            headers: { 'x-auth-token': token }
        });
        setPropiedades(res.data);
      } catch (err) {
        // --- DETECCIÓN DE SUSPENSIÓN ---
        if (err.response && err.response.status === 403) {
            setIsSuspended(true);
        } else {
            console.error(err);
            setError('No se pudieron cargar tus propiedades.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMisPropiedades();
  }, [token, navigate]);

  // --- FUNCIÓN BORRAR ---
  const handleBorrar = async (propiedadId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) return;

    try {
      await axios.delete(`http://localhost:5000/api/propiedades/${propiedadId}`, {
        headers: { 'x-auth-token': token }
      });
      setMensaje({ type: 'success', text: 'Propiedad eliminada correctamente' });
      setPropiedades(propiedades.filter(p => p.id !== propiedadId));
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.msg || 'Error al eliminar' });
    }
  };

  // --- RENDERIZADO 1: CUENTA SUSPENDIDA ---
  if (isSuspended) {
      return (
          <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
              <Paper elevation={3} sx={{ p: 5, borderRadius: '16px', bgcolor: '#fff4e5', border: '1px solid #ffcc80' }}>
                  <ReportProblem sx={{ fontSize: 80, color: '#ef6c00', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" color="#e65100" gutterBottom>
                      Cuenta Suspendida Temporalmente
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
                      Tus propiedades han sido ocultadas del catálogo público y no puedes realizar nuevas publicaciones por el momento.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                      Esto puede deberse a un incumplimiento de normas o falta de actualización de datos.
                      Por favor, contacta con la administración para reactivar tu cuenta.
                  </Typography>
                  
                  <Button 
                    variant="contained" color="warning" size="large"
                    startIcon={<WhatsApp />}
                    href={`https://wa.me/${telefonoAdmin}?text=Hola, mi cuenta (ID: Suspendido) aparece suspendida. Necesito ayuda.`}
                    target="_blank"
                    sx={{ mt: 2, fontWeight: 'bold', borderRadius: '30px', px: 4 }}
                  >
                    Contactar Administración
                  </Button>
              </Paper>
          </Container>
      );
  }

  // --- RENDERIZADO 2: LISTADO DE PROPIEDADES ---
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800" color="primary">
            Mis Propiedades
        </Typography>
        <Button 
            variant="contained" 
            color="success" 
            startIcon={<AddHome />} 
            component={Link} to="/publicar"
            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
        >
            Nueva Propiedad
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {mensaje.text && <Alert severity={mensaje.type} sx={{ mb: 3 }} onClose={() => setMensaje({type:'', text:''})}>{mensaje.text}</Alert>}

      {propiedades.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" color="textSecondary">No tienes propiedades publicadas.</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} component={Link} to="/publicar">Publicar ahora</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
            {propiedades.map((prop) => (
                <Grid item xs={12} key={prop.id}>
                    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, p: 2, borderRadius: '12px', boxShadow: 3 }}>
                        {/* Imagen */}
                        <CardMedia
                            component="img"
                            sx={{ width: { xs: '100%', sm: 200 }, height: 150, borderRadius: '8px', objectFit: 'cover' }}
                            image={prop.foto_principal || 'https://via.placeholder.com/300'}
                            alt={prop.titulo}
                        />
                        
                        {/* Contenido */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, px: { sm: 3 }, py: { xs: 2, sm: 0 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Typography component="h5" variant="h6" fontWeight="bold">
                                    {prop.titulo}
                                </Typography>
                                <Chip 
                                    label={prop.estado || 'ACTIVA'} 
                                    color={prop.estado === 'ACTIVA' ? 'success' : 'default'} 
                                    size="small" 
                                    variant="outlined" 
                                />
                            </Box>
                            
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                {prop.ciudad}, {prop.provincia}
                            </Typography>
                            
                            <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mt: 'auto' }}>
                                ${new Intl.NumberFormat('es-US').format(prop.precio)}
                            </Typography>
                        </Box>

                        {/* Botones de Acción */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, gap: 1, justifyContent: 'center', borderLeft: { sm: '1px solid #eee' }, pl: { sm: 2 } }}>
                            <Button 
                                variant="outlined" 
                                startIcon={<Edit />} 
                                component={Link} to={`/propiedad/editar/${prop.id}`}
                                fullWidth
                            >
                                Editar
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                startIcon={<Delete />} 
                                onClick={() => handleBorrar(prop.id)}
                                fullWidth
                            >
                                Borrar
                            </Button>
                        </Box>
                    </Card>
                </Grid>
            ))}
        </Grid>
      )}
    </Container>
  );
};

export default MisPropiedades;