// src/components/EditarPerfil.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, Grid, 
  Avatar, Alert, InputAdornment 
} from '@mui/material';

// Iconos
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import LocationCityIcon from '@mui/icons-material/LocationCity';

const EditarPerfil = () => {
  const [formData, setFormData] = useState({ 
    nombre: '', email: '', telefono: '', 
    biografia: '', facebook: '', instagram: '', sitio_web: '',
    ciudad: '', provincia: ''
  });
  
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [mensaje, setMensaje] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
    if (usuarioActual) {
      setFormData({
        nombre: usuarioActual.nombre || '',
        email: usuarioActual.email || '',
        telefono: usuarioActual.telefono || '',
        biografia: usuarioActual.biografia || '',
        facebook: usuarioActual.facebook || '',
        instagram: usuarioActual.instagram || '',
        sitio_web: usuarioActual.sitio_web || '',
        ciudad: usuarioActual.ciudad || '',
        provincia: usuarioActual.provincia || '',
      });
      setFotoPreview(usuarioActual.foto_perfil || '');
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoPerfil(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ type: '', text: '' });
    const token = localStorage.getItem('token');

    try {
      let urlFotoFinal = fotoPreview;

      // 1. Subir foto si existe nueva
      if (fotoPerfil) {
        const formDataFoto = new FormData();
        formDataFoto.append('image', fotoPerfil);
        const resUpload = await axios.post('http://localhost:5000/api/upload', formDataFoto, {
           headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
        });
        urlFotoFinal = resUpload.data.url;
      }

      // 2. Actualizar perfil
      const res = await axios.put(
        'http://localhost:5000/api/usuarios/me',
        { ...formData, foto_perfil: urlFotoFinal },
        { headers: { 'x-auth-token': token } }
      );

      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      setMensaje({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      setMensaje({ type: 'error', text: 'Error al actualizar perfil.' });
      console.error(err);
    }
    setLoading(false);
  };

  return (
    // CAMBIO 1: Margen superior de 120px para que no se esconda tras el menú
    <Box sx={{ maxWidth: '1100px', margin: '120px auto 40px auto', p: 2 }}>
      
      <Typography variant="h4" fontWeight="800" gutterBottom sx={{ mb: 4, color: '#1a237e' }}>
        Mi Perfil Profesional
      </Typography>

      <form onSubmit={onSubmit}>
        <Grid container spacing={4}>
          
          {/* COLUMNA IZQUIERDA (Foto y Ubicación) */}
          {/* CAMBIO 2: Usamos sm={4} para forzar la columna en pantallas medianas */}
          <Grid item xs={12}   md={4}>
            
            {/* Tarjeta de Foto */}
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '16px', mt: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  src={fotoPreview} 
                  alt="Perfil" 
                  sx={{ width: 150, height: 150, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 2, margin: '0 auto' }} 
                />
              </Box>
              <Typography variant="h6" fontWeight="bold">{formData.nombre}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>{formData.email}</Typography>
              
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<CloudUploadIcon />}
                sx={{ mt: 2, borderRadius: '20px' }}
              >
                Cambiar Foto
                <input type="file" hidden accept="image/*" onChange={handleFotoChange} />
              </Button>
            </Paper>

            {/* Tarjeta de Ubicación */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', mt: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Ubicación</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Provincia" name="provincia"
                    value={formData.provincia} onChange={handleChange}
                    size="small" 
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon fontSize="small"/></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Ciudad" name="ciudad"
                    value={formData.ciudad} onChange={handleChange}
                    size="small" 
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon fontSize="small"/></InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid> {/* Fin Columna Izquierda */}

          {/* COLUMNA DERECHA (Formulario Principal) */}
          {/* CAMBIO 2: Usamos sm={8} */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>Información Básica</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleChange} variant="outlined" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 099..." variant="outlined" />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Sobre Mí (Biografía)" name="biografia"
                    value={formData.biografia} onChange={handleChange}
                    multiline rows={4}
                    placeholder="Cuéntale a tus clientes sobre tu experiencia..."
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 3 }}>Redes Sociales</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Facebook (URL)" name="facebook"
                    value={formData.facebook} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FacebookIcon color="primary"/></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Instagram (URL)" name="instagram"
                    value={formData.instagram} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><InstagramIcon sx={{ color: '#E1306C' }}/></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Sitio Web (URL)" name="sitio_web"
                    value={formData.sitio_web} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LanguageIcon /></InputAdornment> }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, textAlign: 'right' }}>
                {mensaje.text && <Alert severity={mensaje.type} sx={{ mb: 2, display: 'inline-flex', width: '100%' }}>{mensaje.text}</Alert>}
                <Button 
                  type="submit" variant="contained" size="large" disabled={loading}
                  sx={{ fontWeight: 'bold', px: 5, py: 1.5, borderRadius: '30px', backgroundColor: '#1a237e' }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Paper>
          </Grid> {/* Fin Columna Derecha */}

        </Grid>
      </form>
    </Box>
  );
};

export default EditarPerfil;