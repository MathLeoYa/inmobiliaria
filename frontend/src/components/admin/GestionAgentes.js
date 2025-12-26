import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, IconButton, Chip, Tooltip, Dialog, 
  DialogTitle, DialogContent, Grid, Button, Alert, 
  DialogActions, Select, MenuItem, InputLabel, FormControl 
} from '@mui/material';
import { 
  Block, CheckCircle, DeleteForever, Visibility, HomeWork, CardMembership 
} from '@mui/icons-material';

const GestionAgentes = () => {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [openPropiedadesModal, setOpenPropiedadesModal] = useState(false);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  
  // Data Seleccionada
  const [propiedadesAgente, setPropiedadesAgente] = useState([]);
  const [agenteSeleccionado, setAgenteSeleccionado] = useState(null);
  
  // Planes
  const [planes, setPlanes] = useState([]); 
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const token = localStorage.getItem('token');

  // Cargar lista de agentes
  const fetchAgentes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/usuarios/lista-agentes', {
        headers: { 'x-auth-token': token }
      });
      setAgentes(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // Cargar Planes al inicio
  useEffect(() => {
      fetchAgentes();
      axios.get('http://localhost:5000/api/planes')
        .then(res => setPlanes(res.data))
        .catch(err => console.error("Error cargando planes", err));
  }, []);

  // --- LÓGICA DE SUSPENSIÓN ---
  const toggleSuspension = async (agente) => {
    const esSuspender = agente.estado_agente !== 'SUSPENDIDO';
    const nuevoEstado = esSuspender ? 'SUSPENDIDO' : 'APROBADO';
    let motivo = '';

    if (esSuspender) {
        motivo = window.prompt(`Estás a punto de SUSPENDER a ${agente.nombre}.\n\nEscribe el motivo:`);
        if (motivo === null) return; 
        if (motivo.trim() === "") { alert("Debes escribir un motivo."); return; }
    } else {
        if(!window.confirm(`¿Reactivar a ${agente.nombre}?`)) return;
    }

    try {
      await axios.put(`http://localhost:5000/api/usuarios/${agente.id}/cambiar-estado`, 
        { nuevoEstado, mensajeMotivo: motivo }, 
        { headers: { 'x-auth-token': token } }
      );
      alert(esSuspender ? "Agente suspendido." : "Agente reactivado.");
      fetchAgentes(); 
    } catch (err) { alert('Error al cambiar estado'); }
  };

  // --- ELIMINAR AGENTE ---
  const handleDeleteAgent = async (id) => {
    if(!window.confirm("PELIGRO: Esto borrará al agente Y TODAS SUS PROPIEDADES. ¿Continuar?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/usuarios/${id}`, { headers: { 'x-auth-token': token } });
      fetchAgentes();
    } catch (err) { alert('Error al eliminar'); }
  };

  // --- VER PROPIEDADES ---
  const handleVerPropiedades = async (agente) => {
    setAgenteSeleccionado(agente);
    setOpenPropiedadesModal(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/propiedades/admin/usuario/${agente.id}`, {
        headers: { 'x-auth-token': token }
      });
      setPropiedadesAgente(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDeletePropiedad = async (propiedadId) => {
    if(!window.confirm("¿Eliminar esta propiedad?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/propiedades/${propiedadId}`, {
        headers: { 'x-auth-token': token }
      });
      setPropiedadesAgente(prev => prev.filter(p => p.id !== propiedadId));
    } catch (err) { alert('Error al eliminar propiedad'); }
  };

  // --- ASIGNAR PLAN (MANUAL) ---
  const handleOpenPlanModal = (agente) => {
      setAgenteSeleccionado(agente);
      setSelectedPlanId(''); // Resetear selección
      setOpenPlanModal(true);
  };

  const handleAsignarPlan = async () => {
      if (!selectedPlanId) { alert("Selecciona un plan"); return; }
      
      try {
          await axios.post('http://localhost:5000/api/suscripciones/asignar', {
              usuarioId: agenteSeleccionado.id,
              planId: selectedPlanId,
              observaciones: 'Asignado manualmente por Admin desde Panel'
          }, { headers: { 'x-auth-token': token } });
          
          alert(`Plan asignado correctamente a ${agenteSeleccionado.nombre}`);
          setOpenPlanModal(false);
          // Opcional: Podríamos recargar agentes si mostramos el plan en la tabla
      } catch (err) {
          console.error(err);
          alert('Error al asignar el plan. Revisa la consola.');
      }
  };

  return (
    <Box>
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Agente</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Propiedades</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agentes.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={agente.foto_perfil}>{agente.nombre.charAt(0)}</Avatar>
                    <Typography fontWeight="bold">{agente.nombre}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{agente.email}</Typography>
                  <Typography variant="caption" color="textSecondary">{agente.telefono}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={agente.estado_agente} 
                    color={agente.estado_agente === 'APROBADO' ? 'success' : 'error'} 
                    size="small" variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                    <Chip label={agente.total_propiedades} icon={<HomeWork />} size="small" />
                </TableCell>
                <TableCell align="center">
                  {/* BOTONES DE ACCIÓN */}
                  <Tooltip title="Asignar Plan">
                    <IconButton color="secondary" onClick={() => handleOpenPlanModal(agente)}>
                      <CardMembership />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Ver Propiedades">
                    <IconButton color="primary" onClick={() => handleVerPropiedades(agente)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={agente.estado_agente === 'SUSPENDIDO' ? "Reactivar" : "Suspender"}>
                    <IconButton color="warning" onClick={() => toggleSuspension(agente)}>
                      {agente.estado_agente === 'SUSPENDIDO' ? <CheckCircle /> : <Block />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Eliminar Agente">
                    <IconButton color="error" onClick={() => handleDeleteAgent(agente.id)}>
                      <DeleteForever />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL 1: VER PROPIEDADES --- */}
      <Dialog open={openPropiedadesModal} onClose={() => setOpenPropiedadesModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Propiedades de {agenteSeleccionado?.nombre}
            <Button onClick={() => setOpenPropiedadesModal(false)}>Cerrar</Button>
        </DialogTitle>
        <DialogContent dividers>
            {propiedadesAgente.length === 0 ? (
                <Alert severity="info">Este agente no tiene propiedades publicadas.</Alert>
            ) : (
                <Grid container spacing={2}>
                    {propiedadesAgente.map(prop => (
                        <Grid item xs={12} sm={6} key={prop.id}>
                            <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #eee' }}>
                                <Avatar variant="rounded" src={prop.foto_principal} sx={{ width: 80, height: 80 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" noWrap>{prop.titulo}</Typography>
                                    <Typography variant="caption" display="block">${prop.precio} - {prop.ciudad}</Typography>
                                    <Typography variant="caption" color={prop.estado === 'ACTIVA' ? 'green' : 'red'}>
                                        {prop.estado || 'ACTIVA'}
                                    </Typography>
                                </Box>
                                <IconButton color="error" onClick={() => handleDeletePropiedad(prop.id)}>
                                    <DeleteForever />
                                </IconButton>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: ASIGNAR PLAN (NUEVO) --- */}
      <Dialog open={openPlanModal} onClose={() => setOpenPlanModal(false)}>
           <DialogTitle>Asignar Plan a {agenteSeleccionado?.nombre}</DialogTitle>
           <DialogContent sx={{ minWidth: '400px', pt: 2 }}>
               <Alert severity="info" sx={{ mb: 2 }}>
                   Al asignar un plan, se calculará automáticamente la fecha de vencimiento y se notificará al agente.
               </Alert>
               
               <FormControl fullWidth sx={{ mt: 1 }}>
                   <InputLabel>Seleccionar Plan</InputLabel>
                   <Select 
                       value={selectedPlanId} 
                       label="Seleccionar Plan" 
                       onChange={(e) => setSelectedPlanId(e.target.value)}
                   >
                       {planes.map(plan => (
                           <MenuItem key={plan.id} value={plan.id}>
                               {plan.nombre} - ${plan.precio} ({plan.duracion_dias} días)
                           </MenuItem>
                       ))}
                   </Select>
               </FormControl>
           </DialogContent>
           <DialogActions>
               <Button onClick={() => setOpenPlanModal(false)}>Cancelar</Button>
               <Button onClick={handleAsignarPlan} variant="contained" color="primary">
                   Confirmar Asignación
               </Button>
           </DialogActions>
       </Dialog>

    </Box>
  );
};

export default GestionAgentes;