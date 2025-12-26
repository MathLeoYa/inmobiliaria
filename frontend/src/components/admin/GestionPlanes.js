import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControlLabel, Switch, Chip
} from '@mui/material';
import { Edit, Add, Star } from '@mui/icons-material';

const GestionPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    precio_oferta: '',
    max_propiedades: 1,
    max_fotos: 5,
    duracion_dias: 30,
    prioridad_busqueda: 1,
    descripcion: '',
    es_activo: true
  });

  const token = localStorage.getItem('token');

  // Cargar Planes
  const fetchPlanes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/planes');
      setPlanes(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPlanes(); }, []);

  // Abrir Modal (Crear o Editar)
  const handleOpen = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        nombre: plan.nombre,
        precio: plan.precio,
        precio_oferta: plan.precio_oferta || '',
        max_propiedades: plan.max_propiedades,
        max_fotos: plan.max_fotos,
        duracion_dias: plan.duracion_dias,
        prioridad_busqueda: plan.prioridad_busqueda,
        descripcion: plan.descripcion || '',
        es_activo: plan.es_activo
      });
    } else {
      setEditingPlan(null);
      setFormData({
        nombre: '', precio: '', precio_oferta: '', max_propiedades: 1, 
        max_fotos: 5, duracion_dias: 30, prioridad_busqueda: 1, 
        descripcion: '', es_activo: true
      });
    }
    setOpenModal(true);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        // EDITAR
        await axios.put(`http://localhost:5000/api/planes/${editingPlan.id}`, formData, {
          headers: { 'x-auth-token': token }
        });
        alert('Plan actualizado');
      } else {
        // CREAR
        await axios.post('http://localhost:5000/api/planes', formData, {
          headers: { 'x-auth-token': token }
        });
        alert('Plan creado exitosamente');
      }
      setOpenModal(false);
      fetchPlanes();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el plan');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Planes de Suscripción</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Crear Nuevo Plan
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell align="center">Límites (Casas/Fotos)</TableCell>
              <TableCell align="center">Duración</TableCell>
              <TableCell align="center">Prioridad</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {planes.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell fontWeight="bold">{plan.nombre}</TableCell>
                <TableCell>
                    {plan.precio_oferta > 0 ? (
                        <>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#999' }}>${plan.precio}</Typography>
                            <Typography variant="body1" color="green" fontWeight="bold">${plan.precio_oferta}</Typography>
                        </>
                    ) : (
                        `$${plan.precio}`
                    )}
                </TableCell>
                <TableCell align="center">{plan.max_propiedades} casas / {plan.max_fotos} fotos</TableCell>
                <TableCell align="center">{plan.duracion_dias} días</TableCell>
                <TableCell align="center">
                    {plan.prioridad_busqueda === 3 && <Chip icon={<Star />} label="Alta" color="warning" size="small" />}
                    {plan.prioridad_busqueda === 2 && <Chip label="Media" color="info" size="small" />}
                    {plan.prioridad_busqueda === 1 && <Chip label="Normal" size="small" />}
                </TableCell>
                <TableCell align="center">
                    <Chip 
                        label={plan.es_activo ? "Activo" : "Inactivo"} 
                        color={plan.es_activo ? "success" : "default"} 
                        size="small" 
                    />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpen(plan)} color="primary">
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL FORMULARIO --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Negocio'}</DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField label="Nombre del Plan" name="nombre" fullWidth value={formData.nombre} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Precio Normal ($)" name="precio" type="number" fullWidth value={formData.precio} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Precio Oferta ($)" name="precio_oferta" type="number" fullWidth value={formData.precio_oferta} onChange={handleChange} helperText="Opcional" />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Max. Propiedades" name="max_propiedades" type="number" fullWidth value={formData.max_propiedades} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Max. Fotos x Casa" name="max_fotos" type="number" fullWidth value={formData.max_fotos} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Duración (Días)" name="duracion_dias" type="number" fullWidth value={formData.duracion_dias} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Prioridad (1-3)" name="prioridad_busqueda" type="number" fullWidth value={formData.prioridad_busqueda} onChange={handleChange} helperText="3=Aparece primero" />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="Descripción Comercial" name="descripcion" fullWidth multiline rows={3} value={formData.descripcion} onChange={handleChange} />
                </Grid>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={<Switch checked={formData.es_activo} onChange={handleChange} name="es_activo" />}
                        label="Plan Activo (Visible para asignar)"
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">Guardar Plan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionPlanes;