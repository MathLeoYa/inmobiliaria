import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Button, Grid, Card, CardContent, 
  CardHeader, CardActions, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  TextField, Alert, CircularProgress
} from '@mui/material';
import { Check, WhatsApp, Send, ArrowBack, Badge } from '@mui/icons-material';

const SolicitarAgente = () => {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario')));
  const [telefonoAdmin, setTelefonoAdmin] = useState('');
  
  // Estado para controlar la vista (Planes vs Formulario)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [planElegido, setPlanElegido] = useState(''); // 'Gratis', 'Básico', etc.

  // Formulario
  const [formData, setFormData] = useState({
    telefono: usuario?.telefono || '',
    biografia: usuario?.biografia || '',
    cedula: '' // <-- Nuevo campo para validar unicidad
  });

  const [mensaje, setMensaje] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [linkWhatsApp, setLinkWhatsApp] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/configuracion');
            setTelefonoAdmin(res.data.telefono_admin_whatsapp);
        } catch (err) { console.error(err); }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- SELECCIÓN DE PLAN ---
  const handleSeleccionarPlan = (plan) => {
      setPlanElegido(plan.titulo);
      
      if (plan.precio === 'Gratis') {
          // Si es gratis, va directo al formulario sin WhatsApp
          setMostrarFormulario(true);
      } else {
          // Si es pago, abre WhatsApp Y muestra el formulario para registrarse
          const link = crearLinkWp(plan.mensajeWp);
          window.open(link, '_blank');
          setMostrarFormulario(true); // Mostramos el form para que complete sus datos mientras paga
      }
  };

  const crearLinkWp = (mensaje) => {
    if (!telefonoAdmin) return '#';
    const texto = encodeURIComponent(`${mensaje}\n\nMis datos:\nNombre: ${usuario.nombre}\nEmail: ${usuario.email}`);
    return `https://wa.me/${telefonoAdmin}?text=${texto}`;
  };

  const handleSolicitud = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ type: '', text: '' });
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        'http://localhost:5000/api/usuarios/me/solicitar-agente',
        formData, 
        { headers: { 'x-auth-token': token } }
      );

      setMensaje({ type: 'success', text: res.data.msg });
      const nuevoUsuario = { ...usuario, estado_agente: 'PENDIENTE', ...formData };
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      setUsuario(nuevoUsuario);

      // Link WP para soporte post-solicitud
      const textoMensaje = encodeURIComponent(`Hola, envié mi solicitud (${planElegido}). Email: ${usuario.email}.`);
      setLinkWhatsApp(`https://wa.me/${telefonoAdmin}?text=${textoMensaje}`);

    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.msg || 'Error al enviar solicitud' });
    }
    setLoading(false);
  };

  // --- DATOS DE PLANES ---
  const planes = [
    {
      titulo: 'Inicial', precio: 'Gratis', color: '#757575',
      features: ['1 Publicación activa', 'Duración 15 días', 'Baja prioridad'],
      buttonText: 'Empezar Gratis', mensajeWp: ''
    },
    {
      titulo: 'Básico', precio: '$4.99 / mes', color: '#1976d2',
      features: ['3 Publicaciones activas', 'Duración 30 días', 'Soporte WhatsApp'],
      buttonText: 'Seleccionar Básico', mensajeWp: 'Hola, quiero el Plan BÁSICO ($4.99).'
    },
    {
      titulo: 'Premium', precio: '$9.99 / mes', recommended: true, color: '#ed6c02',
      features: ['10 Publicaciones', '🔥 Posicionamiento', 'Sello Verificado ✅'],
      buttonText: 'Quiero ser Premium', mensajeWp: 'Hola, quiero el Plan PREMIUM ($9.99).'
    },
    {
      titulo: 'Agencias', precio: '$19.99 / mes', color: '#2e7d32',
      features: ['Propiedades Ilimitadas', 'Dashboard', 'Reportes'],
      buttonText: 'Contactar', mensajeWp: 'Hola, me interesa el Plan AGENCIAS.'
    }
  ];

  if (!usuario) return <Typography sx={{ p: 4 }}>Debes iniciar sesión.</Typography>;

  // --- VISTA 1: STATUS PENDIENTE ---
  if (usuario.estado_agente === 'PENDIENTE') {
      return (
          <Box sx={{ maxWidth: '600px', margin: '40px auto', p: 2 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', textAlign: 'center', bgcolor: '#fff3e0', border: '1px solid #ffb74d' }}>
                <Typography variant="h5" fontWeight="bold" color="warning.main" gutterBottom>⏳ Solicitud en Revisión</Typography>
                <Typography sx={{ mb: 3 }}>Un administrador está verificando tu Cédula/RUC y tus datos.</Typography>
                {linkWhatsApp ? (
                    <Button href={linkWhatsApp} target="_blank" variant="contained" color="success" startIcon={<WhatsApp />}>Contactar Admin</Button>
                ) : (
                    <Button href={`https://wa.me/${telefonoAdmin}`} target="_blank" variant="outlined" color="warning">Soporte</Button>
                )}
            </Paper>
          </Box>
      );
  }

  // --- VISTA 2: STATUS APROBADO ---
  if (usuario.estado_agente === 'APROBADO' || usuario.rol === 'AGENTE') {
      return (
        <Box sx={{ maxWidth: '800px', margin: '40px auto', p: 2, textAlign: 'center' }}>
             <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', bgcolor: '#e8f5e9' }}>
                <Typography variant="h4" gutterBottom>🎉</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">¡Ya eres parte del equipo!</Typography>
                <Typography sx={{ mb: 3 }}>Tienes un plan activo. ¿Necesitas mejorar tu plan?</Typography>
                <Grid container spacing={2} justifyContent="center">
                     <Grid item><Button variant="contained" href="/publicar">Publicar Propiedad</Button></Grid>
                     <Grid item><Button variant="outlined" href={`https://wa.me/${telefonoAdmin}?text=Hola, quiero mejorar mi plan.`} target="_blank">Mejorar Plan (WhatsApp)</Button></Grid>
                </Grid>
             </Paper>
        </Box>
      );
  }

  // --- VISTA 3: FORMULARIO DE DATOS (Paso 2) ---
  if (mostrarFormulario) {
      return (
          <Box sx={{ maxWidth: '600px', margin: '40px auto', p: 2 }}>
              <Button startIcon={<ArrowBack />} onClick={() => setMostrarFormulario(false)} sx={{ mb: 2 }}>Volver a Planes</Button>
              <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
                  <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                      Completa tu Perfil ({planElegido})
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      Para activar tu cuenta, necesitamos verificar tu identidad. Esto evita el fraude y protege a la comunidad.
                  </Typography>

                  <form onSubmit={handleSolicitud}>
                      <TextField
                        label="Cédula o RUC"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        fullWidth required
                        sx={{ mb: 3 }}
                        InputProps={{ startAdornment: <Badge color="primary" variant="dot" sx={{ mr: 1 }} /> }}
                        helperText="Este documento debe ser único en la plataforma."
                      />
                      <TextField
                        label="Teléfono / WhatsApp"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        fullWidth required
                        sx={{ mb: 3 }}
                      />
                      <TextField
                        label="Experiencia / Motivación"
                        name="biografia"
                        value={formData.biografia}
                        onChange={handleChange}
                        fullWidth required multiline rows={3}
                        sx={{ mb: 3 }}
                        placeholder="Breve descripción de tu experiencia..."
                      />

                      <Button 
                        type="submit" variant="contained" size="large" fullWidth disabled={loading}
                        endIcon={loading ? <CircularProgress size={20} /> : <Send />}
                        sx={{ fontWeight: 'bold', py: 1.5 }}
                      >
                        {loading ? 'Verificando...' : 'Enviar Solicitud'}
                      </Button>
                  </form>
                  
                  {mensaje.text && <Alert severity={mensaje.type} sx={{ mt: 3 }}>{mensaje.text}</Alert>}
              </Paper>
          </Box>
      );
  }

  // --- VISTA 4: SELECCIÓN DE PLANES (Paso 1 - Default) ---
  return (
    <Box sx={{ maxWidth: '1200px', margin: '40px auto', p: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight="800" color="#1a237e" gutterBottom>Planes para Agentes</Typography>
        <Typography variant="h6" color="textSecondary">Publica tus propiedades y llega a miles de clientes.</Typography>
      </Box>

      <Grid container spacing={4} alignItems="flex-end">
        {planes.map((plan) => (
          <Grid item key={plan.titulo} xs={12} sm={6} md={3}>
            <Card 
                elevation={plan.recommended ? 12 : 2} 
                sx={{ 
                    borderRadius: '16px', position: 'relative',
                    transform: plan.recommended ? 'scale(1.05)' : 'scale(1)',
                    border: plan.recommended ? `2px solid ${plan.color}` : '1px solid #eee',
                    transition: '0.3s', '&:hover': { transform: plan.recommended ? 'scale(1.08)' : 'scale(1.03)' }
                }}
            >
              {plan.recommended && <Chip label="RECOMENDADO" color="warning" sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold', fontSize: '0.7rem' }} />}
              <CardHeader title={plan.titulo} titleTypographyProps={{ align: 'center', fontWeight: 'bold', color: plan.color }} sx={{ backgroundColor: '#fafafa', pb: 0 }} />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2, mt: 2 }}>
                  <Typography component="h2" variant="h4" color="text.primary" fontWeight="800">{plan.precio}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ padding: 0 }}>
                  {plan.features.map((line) => (
                    <ListItem key={line} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: '30px' }}><Check fontSize="small" sx={{ color: plan.color }} /></ListItemIcon>
                      <ListItemText primary={line} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button 
                  fullWidth 
                  variant={plan.recommended ? 'contained' : 'outlined'}
                  onClick={() => handleSeleccionarPlan(plan)}
                  sx={{ 
                      fontWeight: 'bold', py: 1, borderRadius: '20px',
                      borderColor: plan.color, color: plan.recommended ? 'white' : plan.color,
                      backgroundColor: plan.recommended ? plan.color : 'transparent',
                      '&:hover': { backgroundColor: plan.recommended ? plan.color : '#f5f5f5', opacity: 0.9 }
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SolicitarAgente;