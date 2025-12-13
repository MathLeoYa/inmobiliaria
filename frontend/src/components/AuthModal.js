// src/components/AuthModal.js
import React, { useState } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, Box, Typography, TextField, Button,
    IconButton, Divider, InputAdornment, Tabs, Tab, Alert, CircularProgress
} from '@mui/material';
import { Close, Google, Facebook, Visibility, VisibilityOff } from '@mui/icons-material';

const AuthModal = ({ open, onClose, initialTab = 0 }) => {
    const [tabValue, setTabValue] = useState(initialTab);
    const [showPassword, setShowPassword] = useState(false);
    
    // Estados del formulario
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        setTabValue(initialTab);
        setError(''); // Limpiar errores al abrir
        setFormData({ nombre: '', email: '', password: '' }); // Limpiar campos
    }, [open, initialTab]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError('');
    };

    // --- LÓGICA DE INICIO DE SESIÓN ---
    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email: formData.email,
                password: formData.password
            });

            // Guardar sesión
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('usuario', JSON.stringify(res.data.usuario));

            onClose(); // Cerrar modal
            window.location.reload(); // Recargar para actualizar Navbar

        } catch (err) {
            setError(err.response?.data?.msg || 'Error al iniciar sesión');
        }
        setLoading(false);
    };

    // --- LÓGICA DE REGISTRO ---
    const handleRegister = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password
            });

            // Auto-login después del registro (Opcional, pero recomendado)
            // Si tu backend devuelve token al registrar, úsalo. Si no, pide login.
            // Asumimos que el usuario debe loguearse o el backend ya dio token?
            // En nuestro backend actual /register NO devuelve token, solo msg.
            // Así que cambiamos al tab de login y mostramos éxito.
            
            setTabValue(0); // Cambiar a pestaña Login
            setError(''); 
            alert('Cuenta creada con éxito. Por favor inicia sesión.'); // Feedback simple
            setFormData({ ...formData, password: '' }); // Limpiar pass

        } catch (err) {
            setError(err.response?.data?.msg || 'Error al registrarse');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
                    {tabValue === 0 ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'grey.500' }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            
            <DialogContent>
                {/* Mensaje de Error */}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Botones Sociales (Visuales por ahora) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    <Button variant="outlined" startIcon={<Google />} fullWidth sx={{ color: '#db4437', borderColor: '#db4437', textTransform: 'none' }}>
                        Continuar con Google
                    </Button>
                    <Button variant="outlined" startIcon={<Facebook />} fullWidth sx={{ color: '#4267B2', borderColor: '#4267B2', textTransform: 'none' }}>
                        Continuar con Facebook
                    </Button>
                </Box>

                <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">O continúa con email</Typography></Divider>

                <Tabs value={tabValue} onChange={handleTabChange} centered variant="fullWidth" sx={{ mb: 3 }}>
                    <Tab label="Ingresar" />
                    <Tab label="Registrarse" />
                </Tabs>

                {tabValue === 0 && (
                    <Box component="form" onSubmit={handleLogin}>
                        <TextField margin="normal" required fullWidth label="Correo Electrónico" name="email" autoComplete="email" value={formData.email} onChange={handleChange} />
                        <TextField 
                            margin="normal" required fullWidth label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
                        />
                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, bgcolor: '#1a237e', py: 1.5 }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                        </Button>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box component="form" onSubmit={handleRegister}>
                        <TextField margin="normal" required fullWidth label="Nombre Completo" name="nombre" value={formData.nombre} onChange={handleChange} />
                        <TextField margin="normal" required fullWidth label="Correo Electrónico" name="email" value={formData.email} onChange={handleChange} />
                        <TextField 
                            margin="normal" required fullWidth label="Contraseña" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
                            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
                        />
                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, bgcolor: '#4caf50', py: 1.5 }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear Cuenta'}
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;