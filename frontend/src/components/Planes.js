import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Card, CardContent, CardActions, Typography, 
  Button, Box, Chip, List, ListItem, ListItemIcon, ListItemText, CircularProgress
} from '@mui/material';
import { Check, Star, WhatsApp, WorkspacePremium } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Planes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Datos del usuario actual
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const TELEFONO_ADMIN = "593999999999"; // TU NÚMERO AQUÍ

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        // Obtenemos los planes creados por el ADMIN en la base de datos
        const res = await axios.get('http://localhost:5000/api/planes');
        setPlanes(res.data);
      } catch (err) {
        console.error("Error cargando planes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlanes();
  }, []);

  // Función para manejar el clic en el plan
  const handlePlanAction = (plan) => {
    if (!token) {
        // Si no está logueado, mandar a registrarse
        alert("Por favor regístrate o inicia sesión para contratar un plan.");
        // Aquí podrías abrir el modal de Auth si lo tienes global, o redirigir
        return;
    }

    if (usuario?.rol === 'AGENTE' || usuario?.rol === 'ADMIN') {
        // SI YA ES AGENTE -> WhatsApp para Upgrade
        const mensaje = `Hola Admin, soy el agente ${usuario.nombre}. Me interesa mejorar mi cuenta al plan: *${plan.nombre}* ($${plan.precio}). ¿Cómo procedo con el pago?`;
        const url = `https://wa.me/${TELEFONO_ADMIN}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    } else {
        // SI ES CLIENTE -> WhatsApp para solicitar ser Agente
        const mensaje = `Hola, soy ${usuario.nombre}. Quiero registrarme como Agente Inmobiliario contratando el plan: *${plan.nombre}*.`;
        const url = `https://wa.me/${TELEFONO_ADMIN}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    }
  };

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="900" color="#1a237e" gutterBottom>
          Planes para Agentes
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Elige la potencia que necesitas para vender más rápido.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {planes.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card 
                elevation={plan.prioridad_busqueda === 3 ? 12 : 3} 
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '16px',
                    position: 'relative',
                    border: plan.prioridad_busqueda === 3 ? '2px solid #ffca28' : 'none',
                    transform: plan.prioridad_busqueda === 3 ? 'scale(1.05)' : 'scale(1)',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-5px)' }
                }}
            >
              {plan.prioridad_busqueda === 3 && (
                  <Chip 
                    label="RECOMENDADO" 
                    color="warning" 
                    sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }} 
                  />
              )}

              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
                  {plan.nombre}
                </Typography>
                
                <Box sx={{ my: 2 }}>
                    {plan.precio_oferta > 0 && plan.precio_oferta < plan.precio ? (
                        <>
                            <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#999' }}>
                                ${plan.precio}
                            </Typography>
                            <Typography variant="h3" color="primary.main" fontWeight="bold">
                                ${plan.precio_oferta}<Typography component="span" variant="h6" color="textSecondary">/mes</Typography>
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="h3" color="primary.main" fontWeight="bold">
                            ${plan.precio}<Typography component="span" variant="h6" color="textSecondary">/mes</Typography>
                        </Typography>
                    )}
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                    {plan.descripcion}
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon><Check color="success" /></ListItemIcon>
                    <ListItemText primary={<strong>{plan.max_propiedades} Propiedades Activas</strong>} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Check color="success" /></ListItemIcon>
                    <ListItemText primary={`Hasta ${plan.max_fotos} fotos por casa`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Check color="success" /></ListItemIcon>
                    <ListItemText primary={`Duración: ${plan.duracion_dias} días`} />
                  </ListItem>
                  {plan.prioridad_busqueda > 1 && (
                      <ListItem>
                        <ListItemIcon><Star sx={{ color: '#ffca28' }} /></ListItemIcon>
                        <ListItemText primary="Prioridad en Búsquedas" />
                      </ListItem>
                  )}
                </List>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button 
                    fullWidth 
                    variant={plan.prioridad_busqueda === 3 ? "contained" : "outlined"} 
                    color={plan.prioridad_busqueda === 3 ? "primary" : "inherit"}
                    size="large"
                    startIcon={usuario?.rol === 'AGENTE' ? <WorkspacePremium /> : <WhatsApp />}
                    onClick={() => handlePlanAction(plan)}
                    sx={{ borderRadius: '30px', fontWeight: 'bold', py: 1.5 }}
                >
                    {usuario?.rol === 'AGENTE' ? 'Mejorar Plan' : 'Contratar Plan'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Planes;