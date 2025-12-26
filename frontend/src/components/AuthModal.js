import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogContent, Box, Typography, TextField, Button,
  IconButton, InputAdornment, Grid, useMediaQuery, useTheme, Alert, CircularProgress, Divider
} from '@mui/material';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';

// --- IMPORTAR IMAGEN LOCAL ---
// Asegúrate de que la imagen exista en esta ruta:
import loginImage from '../assets/fondo-login.jpg'; 

const AuthModal = ({ open, onClose, initialTab = 0 }) => { 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLogin(initialTab === 0);
    setError('');
    setFormData({ nombre: '', email: '', password: '' });
  }, [open, initialTab]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- LOGIN NORMAL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { nombre: formData.nombre, email: formData.email, password: formData.password };

    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        window.location.reload();
      } else {
        setIsLogin(true); 
        alert('Cuenta creada con éxito. Por favor inicia sesión.');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN CON GOOGLE ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        setLoading(true);
        const res = await axios.post('http://localhost:5000/api/auth/google', {
            token: credentialResponse.credential
        });
        
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        
        window.location.reload();
        onClose();
    } catch (err) {
        console.error('Error Login Google:', err);
        setError('Error al iniciar sesión con Google.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog 
  open={open}
  onClose={onClose}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: '20px',
      overflow: 'hidden',
      height: { md: 600, xs: 'auto' } // 🔑 CLAVE
    }
  }}
    >
      <Grid container sx={{ height: '100%' }}>
        
        {/* --- IZQUIERDA: IMAGEN LOCAL --- */}
        {!isMobile && (
          <Grid item md={6} sx={{ position: 'relative' }}>
            <Box
  sx={{
    width: '100%',
    height: '100%',
    backgroundImage: `url(${loginImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
  }}
            />
            {/* Overlay Oscuro + Texto */}
            <Box sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 4
            }}>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>“</Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 500, fontStyle: 'italic', mb: 1 }}>
                Tu próximo hogar es el escenario de tus mejores recuerdos.
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#ddd', mt: 2 }}>
                EliteHomes
              </Typography>
            </Box>
          </Grid>
        )}

        {/* --- DERECHA: FORMULARIO --- */}
        <Grid item
  xs={12}
  md={6}
  sx={{
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2 // 🔑 evita que nada lo tape
   }}>
          <IconButton 
            onClick={onClose} 
            sx={{ position: 'absolute', top: 10, right: 10, color: '#aaa' }}
          >
            <Close />
          </IconButton>

          <DialogContent sx={{ p: { xs: 3, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            
            <Typography variant="h4" fontWeight="800" color="#1a237e" gutterBottom>
              {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
              {isLogin ? 'Ingresa tus datos para continuar.' : 'Únete a la comunidad de bienes raíces líder.'}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* BOTONES SOCIALES */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, alignItems: 'center' }}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Falló el inicio de sesión con Google')}
                    useOneTap
                    width="300"
                    theme="filled_blue"
                    shape="pill"
                    text={isLogin ? "signin_with" : "signup_with"}
                />
            </Box>

            <Divider sx={{ mb: 3, color: '#999', fontSize: '0.9rem' }}>o usa tu correo</Divider>

            <Box component="form" onSubmit={handleSubmit}>
              {!isLogin && (
                <TextField
                  margin="normal" fullWidth label="Nombre Completo" name="nombre"
                  value={formData.nombre} onChange={handleChange} required
                  size="small"
                  InputProps={{ sx: { borderRadius: '8px' } }}
                />
              )}
              <TextField
                margin="normal" fullWidth label="Correo Electrónico" name="email"
                value={formData.email} onChange={handleChange} required
                size="small"
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
              <TextField
                margin="normal" fullWidth label="Contraseña" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange} required
                size="small"
                InputProps={{
                  sx: { borderRadius: '8px' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {isLogin && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button size="small" sx={{ textTransform: 'none', color: '#666' }}>
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>
              )}

              <Button
                type="submit" fullWidth variant="contained" disabled={loading}
                sx={{ 
                  mt: 3, mb: 2, py: 1.2, borderRadius: '30px', 
                  fontSize: '1rem', fontWeight: 'bold', bgcolor: '#1a237e',
                  '&:hover': { bgcolor: '#0d1a6b' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Ingresar' : 'Registrarse')}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes cuenta? "}
                <Button 
                  onClick={() => setIsLogin(!isLogin)} 
                  sx={{ textTransform: 'none', fontWeight: 'bold', color: '#1a237e', p: 0, minWidth: 'auto' }}
                >
                  {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
                </Button>
              </Typography>
            </Box>

          </DialogContent>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default AuthModal;