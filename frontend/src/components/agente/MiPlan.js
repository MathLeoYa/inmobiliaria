import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Paper, Typography, Box, Button, LinearProgress, Chip, Card, CardContent, Divider 
} from '@mui/material';
import { 
  Star, WhatsApp, AccessTime, HomeWork, CheckCircle 
} from '@mui/icons-material';

const MiPlan = () => {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propiedadesCount, setPropiedadesCount] = useState(0);
  const token = localStorage.getItem('token');

  // Teléfono del Admin para el botón de Upgrade (configúralo o tráelo del backend)
  const TELEFONO_ADMIN = "593999999999"; 

  useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Obtener datos del plan
            const resPlan = await axios.get('http://localhost:5000/api/suscripciones/mi-plan', {
                headers: { 'x-auth-token': token }
            });
            setPlanData(resPlan.data);

            // 2. Contar propiedades actuales
            const resProps = await axios.get('http://localhost:5000/api/propiedades/me', {
                headers: { 'x-auth-token': token }
            });
            setPropiedadesCount(resProps.data.length);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [token]);

  if (loading) return <p>Cargando información de tu plan...</p>;

  // Cálculo de días restantes
  const fechaFin = new Date(planData?.fecha_fin);
  const hoy = new Date();
  const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
  const porcentajeUso = planData ? (propiedadesCount / planData.max_propiedades) * 100 : 0;

  // Renderizado si NO tiene plan activo
  if (!planData || planData.estado === 'SIN_PLAN') {
      return (
          <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
              <Paper elevation={3} sx={{ p: 5, borderRadius: '16px', bgcolor: '#fff3e0' }}>
                  <Typography variant="h4" fontWeight="bold" color="error" gutterBottom>
                      Sin Plan Activo
                  </Typography>
                  <Typography variant="body1" paragraph>
                      Actualmente no tienes una suscripción activa o tu plan ha caducado.
                      Tus propiedades no son visibles al público.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    size="large"
                    startIcon={<WhatsApp />}
                    href={`https://wa.me/${TELEFONO_ADMIN}?text=Hola, quiero activar un plan para mi cuenta de agente.`}
                    target="_blank"
                  >
                    Contactar para Activar
                  </Button>
              </Paper>
          </Container>
      );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight="800" color="#1a237e" gutterBottom>
        Mi Suscripción
      </Typography>

      <Grid container spacing={4}>
        
        {/* TARJETA PRINCIPAL DEL PLAN */}
        <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%', position: 'relative', overflow: 'visible' }}>
                <Box sx={{ 
                    position: 'absolute', top: -15, right: 20, 
                    bgcolor: '#ffca28', color: '#000', px: 2, py: 0.5, borderRadius: '20px', fontWeight: 'bold', boxShadow: 2 
                }}>
                    ESTADO: {planData.estado}
                </Box>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="overline" color="textSecondary">Plan Actual</Typography>
                    <Typography variant="h3" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                        {planData.nombre_plan}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <AccessTime color="action" />
                        <Typography variant="h6">
                            Vence en <strong>{diasRestantes} días</strong> ({new Date(planData.fecha_fin).toLocaleDateString()})
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>Consumo de Propiedades</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{propiedadesCount} utilizadas</Typography>
                        <Typography variant="body2" fontWeight="bold">Límite: {planData.max_propiedades}</Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={porcentajeUso > 100 ? 100 : porcentajeUso} 
                        sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: porcentajeUso > 90 ? 'red' : 'green' } }} 
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        {propiedadesCount >= planData.max_propiedades 
                            ? "⛔ Has alcanzado tu límite. No puedes publicar más." 
                            : "✅ Aún tienes cupo disponible."}
                    </Typography>
                </CardContent>
            </Card>
        </Grid>

        {/* TARJETA DE BENEFICIOS Y UPGRADE */}
        <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '16px', height: '100%', bgcolor: '#f8f9fa', border: '1px solid #eee' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Beneficios de tu nivel</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <CheckCircle color="success" />
                            <Typography>Publicar hasta <strong>{planData.max_propiedades} propiedades</strong>.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <CheckCircle color="success" />
                            <Typography>Límite de <strong>{planData.max_fotos} fotos</strong> por propiedad.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Star sx={{ color: '#ffca28' }} />
                            <Typography>Prioridad en búsquedas: <strong>Nivel {planData.prioridad_busqueda || 'Estándar'}</strong></Typography>
                        </Box>
                    </Box>

                    <Box sx={{ bgcolor: '#e3f2fd', p: 3, borderRadius: '12px', textAlign: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="#1565c0" gutterBottom>
                            ¿Necesitas más cupo?
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Mejora tu plan hoy mismo para publicar sin límites y destacar sobre la competencia.
                        </Typography>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            fullWidth
                            startIcon={<WhatsApp />}
                            href={`https://wa.me/${TELEFONO_ADMIN}?text=Hola, quiero MEJORAR mi plan actual (${planData.nombre_plan}).`}
                            target="_blank"
                            sx={{ borderRadius: '30px', fontWeight: 'bold' }}
                        >
                            Solicitar Upgrade
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Grid>

      </Grid>
    </Container>
  );
};

export default MiPlan;