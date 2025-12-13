// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Grid, Button, Avatar, Chip, 
  Tabs, Tab, CircularProgress, Alert, Container, IconButton, Divider
} from '@mui/material';
import { 
  CheckCircle, Cancel, AccessTime, Phone, Email, 
  WorkOutline, ArrowBack 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: Pendientes, 1: Aprobadas, 2: Rechazadas
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Cargar datos
  const fetchSolicitudes = async () => {
    try {
      // Nota: Asegúrate de haber actualizado el endpoint en el backend a '/solicitudes-agente'
      // Si no, usa el anterior '/solicitudes-pendientes' pero solo verás pendientes.
      const res = await axios.get('http://localhost:5000/api/usuarios/solicitudes-agente', {
        headers: { 'x-auth-token': token }
      });
      setSolicitudes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSolicitudes(); }, []);

  // Filtrar según el Tab seleccionado
  const getFilteredSolicitudes = () => {
    switch (tabValue) {
      case 0: return solicitudes.filter(u => u.estado_agente === 'PENDIENTE');
      case 1: return solicitudes.filter(u => u.estado_agente === 'APROBADO');
      case 2: return solicitudes.filter(u => u.estado_agente === 'RECHAZADO');
      default: return solicitudes;
    }
  };

  // Acciones
  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'aprobar' 
        ? `http://localhost:5000/api/usuarios/${id}/aprobar-agente`
        : `http://localhost:5000/api/usuarios/${id}/rechazar-agente`;

      await axios.put(endpoint, {}, { headers: { 'x-auth-token': token } });
      
      // Recargar lista
      fetchSolicitudes();
    } catch (err) {
      alert('Error al procesar la solicitud');
    }
  };

  const filteredList = getFilteredSolicitudes();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 4 }}>
      <Container maxWidth="lg">
        
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2, color: '#666' }}>
            Volver al Inicio
          </Button>
          <Typography variant="h4" fontWeight="800" color="#1a237e" gutterBottom>
            Solicitudes de Agente
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gestiona quién puede publicar propiedades en EliteHomes.
          </Typography>
        </Box>

        {/* Tabs de Filtro */}
        <Paper sx={{ mb: 4, borderRadius: '12px' }} elevation={0}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label={`Pendientes (${solicitudes.filter(u => u.estado_agente === 'PENDIENTE').length})`} />
            <Tab label={`Aprobadas (${solicitudes.filter(u => u.estado_agente === 'APROBADO').length})`} />
            <Tab label={`Rechazadas (${solicitudes.filter(u => u.estado_agente === 'RECHAZADO').length})`} />
          </Tabs>
        </Paper>

        {/* Lista de Tarjetas */}
        <Grid container spacing={3}>
          {filteredList.length === 0 ? (
            <Grid item xs={12}>
               <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', bgcolor: 'transparent' }} elevation={0}>
                  <Typography variant="h6" color="textSecondary">No hay solicitudes en esta categoría.</Typography>
               </Paper>
            </Grid>
          ) : (
            filteredList.map((user) => (
              <Grid item xs={12} key={user.id}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: '16px', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
                  
                  {/* Columna Izquierda: Info Básica */}
                  <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    <Avatar 
                      src={user.foto_perfil} 
                      sx={{ width: 70, height: 70, border: '2px solid #eee' }}
                    >
                      {user.nombre.charAt(0)}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight="bold">{user.nombre}</Typography>
                        {/* Chip de Estado */}
                        <Chip 
                          label={user.estado_agente} 
                          size="small"
                          color={
                            user.estado_agente === 'PENDIENTE' ? 'warning' :
                            user.estado_agente === 'APROBADO' ? 'success' : 'error'
                          }
                          icon={user.estado_agente === 'PENDIENTE' ? <AccessTime /> : user.estado_agente === 'APROBADO' ? <CheckCircle /> : <Cancel />}
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, color: '#666' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Email fontSize="small" sx={{ color: '#999' }} />
                           <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           <Phone fontSize="small" sx={{ color: '#999' }} />
                           <Typography variant="body2">{user.telefono || 'Sin teléfono'}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Columna Central: Motivación/Bio */}
                  <Box sx={{ flex: 2, bgcolor: '#f9fafb', p: 2, borderRadius: '8px', width: '100%' }}>
                     <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkOutline fontSize="small" /> Motivación / Biografía
                     </Typography>
                     <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                        "{user.biografia || 'El usuario no ha proporcionado una biografía aún.'}"
                     </Typography>
                  </Box>

                  {/* Columna Derecha: Acciones */}
                  {user.estado_agente === 'PENDIENTE' && (
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', md: 'column' }, minWidth: '140px' }}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<CheckCircle />}
                        onClick={() => handleAction(user.id, 'aprobar')}
                        fullWidth
                      >
                        Aprobar
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<Cancel />}
                        onClick={() => handleAction(user.id, 'rechazar')}
                        fullWidth
                      >
                        Rechazar
                      </Button>
                    </Box>
                  )}
                  
                  {/* Si ya está procesado, mostrar acciones de deshacer o info */}
                  {user.estado_agente !== 'PENDIENTE' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '140px', height: '100%' }}>
                          <Typography variant="caption" color="textSecondary">Procesado</Typography>
                      </Box>
                  )}

                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminPanel;