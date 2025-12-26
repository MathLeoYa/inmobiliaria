    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import { 
    Container, Paper, Grid, Typography, Avatar, TextField, Button, Box, 
    Chip, Divider, Alert, CircularProgress, Card, CardContent 
    } from '@mui/material';
    import { 
    Save, Edit, VerifiedUser, WhatsApp, Facebook, Instagram, Language 
    } from '@mui/icons-material';

    const Perfil = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ type: '', text: '' });
    const [editMode, setEditMode] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        biografia: '',
        facebook: '',
        instagram: '',
        sitio_web: '',
        ciudad: '',
        provincia: ''
    });

    const token = localStorage.getItem('token');

    // Cargar datos del usuario
    useEffect(() => {
        const fetchPerfil = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/usuarios/me', {
            headers: { 'x-auth-token': token }
            });
            setUsuario(res.data);
            setFormData({
            nombre: res.data.nombre || '',
            telefono: res.data.telefono || '',
            biografia: res.data.biografia || '',
            facebook: res.data.facebook || '',
            instagram: res.data.instagram || '',
            sitio_web: res.data.sitio_web || '',
            ciudad: res.data.ciudad || '',
            provincia: res.data.provincia || ''
            });
        } catch (err) {
            console.error(err);
            setMensaje({ type: 'error', text: 'Error al cargar perfil.' });
        } finally {
            setLoading(false);
        }
        };
        if (token) fetchPerfil();
    }, [token]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        
        try {
        const res = await axios.put('http://localhost:5000/api/usuarios/me', formData, {
            headers: { 'x-auth-token': token }
        });
        setUsuario(res.data.usuario); // Actualizar vista con datos nuevos
        // Actualizar localStorage para que el nombre persista en el header
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        
        setMensaje({ type: 'success', text: 'Perfil actualizado correctamente.' });
        setEditMode(false);
        } catch (err) {
        setMensaje({ type: 'error', text: 'Error al actualizar.' });
        }
    };

    // Solicitar ser agente
    const handleSolicitarAgente = async () => {
        if (!formData.telefono) {
            setMensaje({ type: 'warning', text: 'Debes guardar un teléfono antes de solicitar ser agente.' });
            return;
        }
        // Redirigir a formulario de solicitud o hacerlo aquí (depende de tu flujo anterior)
        window.location.href = '/solicitar-agente';
    };

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', mt:10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h4" fontWeight="800" color="#1a237e" gutterBottom>
            Mi Perfil
        </Typography>

        {mensaje.text && <Alert severity={mensaje.type} sx={{ mb: 3 }}>{mensaje.text}</Alert>}

        <Grid container spacing={3}>
            
            {/* COLUMNA IZQUIERDA: TARJETA DE USUARIO */}
            <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '16px' }}>
                <Avatar 
                src={usuario?.foto_perfil} 
                sx={{ width: 120, height: 120, margin: '0 auto', mb: 2, border: '4px solid #e3f2fd' }}
                >
                    {usuario?.nombre?.charAt(0)}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold">{usuario?.nombre}</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>{usuario?.email}</Typography>
                
                <Chip 
                label={usuario?.rol} 
                color={usuario?.rol === 'ADMIN' ? 'error' : usuario?.rol === 'AGENTE' ? 'success' : 'primary'} 
                sx={{ mt: 1, fontWeight: 'bold' }} 
                />

                {usuario?.rol === 'CLIENTE' && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 1 }}>
                            ¿Quieres publicar propiedades?
                        </Typography>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            size="small"
                            onClick={handleSolicitarAgente}
                        >
                            Solicitar ser Agente
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Estadísticas rápidas (Opcional) */}
            {usuario?.rol === 'AGENTE' && (
                <Card sx={{ mt: 3, borderRadius: '16px' }}>
                    <CardContent>
                        <Typography variant="h6" fontSize="1rem">Tu Plan Actual</Typography>
                        <Typography variant="h4" color="primary" fontWeight="bold">Gratis</Typography>
                        <Typography variant="caption" color="textSecondary">Límite: 3 Propiedades</Typography>
                    </CardContent>
                </Card>
            )}
            </Grid>

            {/* COLUMNA DERECHA: FORMULARIO EDITABLE */}
            <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" color="#555">
                        Información Personal
                    </Typography>
                    <Button 
                        startIcon={editMode ? <Save /> : <Edit />} 
                        variant={editMode ? "contained" : "text"}
                        onClick={() => editMode ? document.getElementById('perfil-form').requestSubmit() : setEditMode(true)}
                    >
                        {editMode ? 'Guardar' : 'Editar'}
                    </Button>
                </Box>

                <form id="perfil-form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField 
                                label="Nombre Completo" name="nombre" fullWidth 
                                value={formData.nombre} onChange={handleChange} 
                                disabled={!editMode}
                            />
                        </Grid>
                        
                        {/* CAMPO CRÍTICO PARA WHATSAPP */}
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Teléfono / WhatsApp" name="telefono" fullWidth 
                                value={formData.telefono} onChange={handleChange} 
                                disabled={!editMode}
                                placeholder="Ej: 593991234567"
                                InputProps={{
                                    startAdornment: <WhatsApp sx={{ color: '#aaa', mr: 1 }} />
                                }}
                                helperText={editMode && "Importante: Incluye el código de país (Ej: 593)"}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Ciudad de Residencia" name="ciudad" fullWidth 
                                value={formData.ciudad} onChange={handleChange} 
                                disabled={!editMode}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField 
                                label="Biografía / Sobre mí" name="biografia" fullWidth multiline rows={3}
                                value={formData.biografia} onChange={handleChange} 
                                disabled={!editMode}
                                placeholder="Cuéntales a tus clientes sobre tu experiencia..."
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}>Redes Sociales (Opcional)</Divider>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="Facebook (URL)" name="facebook" fullWidth size="small"
                                value={formData.facebook} onChange={handleChange} disabled={!editMode}
                                InputProps={{ startAdornment: <Facebook sx={{ color: '#1877F2', mr: 1 }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="Instagram (URL)" name="instagram" fullWidth size="small"
                                value={formData.instagram} onChange={handleChange} disabled={!editMode}
                                InputProps={{ startAdornment: <Instagram sx={{ color: '#E1306C', mr: 1 }} /> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="Sitio Web" name="sitio_web" fullWidth size="small"
                                value={formData.sitio_web} onChange={handleChange} disabled={!editMode}
                                InputProps={{ startAdornment: <Language sx={{ color: '#555', mr: 1 }} /> }}
                            />
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            </Grid>

        </Grid>
        </Container>
    );
    };

    export default Perfil;