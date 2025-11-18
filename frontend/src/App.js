// src/App.js
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link as RouterLink,
  useNavigate,
} from 'react-router-dom';

import {
  AppBar, Toolbar, Typography, Button, Box, CssBaseline,
  IconButton, Menu, MenuItem, Container, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Avatar // <-- 1. AQUÍ AGREGAMOS EL IMPORT DE AVATAR
} from '@mui/material';

// Iconos
import AddHomeIcon from '@mui/icons-material/AddHome';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// Componentes
import Catalogo from './components/Catalogo';
import Register from './components/Register';
import Login from './components/Login';
import PropiedadDetalle from './components/PropiedadDetalle';
import RutaProtegida from './components/RutaProtegida';
import MisFavoritos from './components/MisFavoritos';
import AgenteRuta from './components/AgenteRuta';
import CrearPropiedad from './components/CrearPropiedad';
import SolicitarAgente from './components/SolicitarAgente';
import AdminRuta from './components/AdminRuta';
import AdminPanel from './components/AdminPanel';
import MisPropiedades from './components/MisPropiedades';
import EditarPropiedad from './components/EditarPropiedad';
import EditarPerfil from './components/EditarPerfil';
import './App.css';

const NavBar = () => {
  const navigate = useNavigate();
  const estaLogueado = !!localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  // Estado Menú Usuario (Desktop)
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  
  // Estado Menú Móvil (Drawer)
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    handleMenuClose();
    setMobileOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
    window.location.reload();
  };

  const navLinkStyle = {
    color: '#e0e0e0', // Gris muy claro / Blanco
    fontWeight: 500,
    textTransform: 'none',
    fontSize: '0.95rem',
    mx: 1,
    '&:hover': { color: '#ffffff' } // Blanco puro al pasar el mouse
  };  

  // --- CONTENIDO DEL MENÚ MÓVIL ---
  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: '#1a237e', fontWeight: 'bold' }}>
        EliteHomes
      </Typography>
      <Divider />
      <List>
        <ListItem button component={RouterLink} to="/">
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItem>
        
        {estaLogueado ? (
          <>
            <ListItem button component={RouterLink} to="/favoritos">
              <ListItemIcon><FavoriteIcon /></ListItemIcon>
              <ListItemText primary="Favoritos" />
            </ListItem>
            {(usuario?.rol === 'AGENTE' || usuario?.rol === 'ADMIN') ? (
              <>
                <ListItem button component={RouterLink} to="/mis-propiedades">
                   <ListItemText primary="Mis Propiedades" inset />
                </ListItem>
                <ListItem button component={RouterLink} to="/publicar">
                   <ListItemIcon><AddHomeIcon /></ListItemIcon>
                   <ListItemText primary="Nueva Propiedad" />
                </ListItem>
              </>
            ) : (
               <ListItem button component={RouterLink} to="/solicitar-agente">
                   <ListItemText primary="Quiero ser Agente" inset />
               </ListItem>
            )}
             {(usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPER_USUARIO') && (
               <ListItem button component={RouterLink} to="/admin">
                   <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                   <ListItemText primary="Admin Panel" />
               </ListItem>
            )}
            <Divider />
             <ListItem button component={RouterLink} to="/perfil">
               <ListItemIcon>
                 {/* Avatar pequeño en menú móvil */}
                 <Avatar src={usuario?.foto_perfil} sx={{ width: 24, height: 24 }}>{usuario?.nombre?.charAt(0)}</Avatar>
               </ListItemIcon>
               <ListItemText primary="Mi Perfil" />
             </ListItem>
             <ListItem button onClick={handleLogout}>
               <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
               <ListItemText primary="Cerrar Sesión" sx={{ color: 'red' }} />
             </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={RouterLink} to="/login">
               <ListItemIcon><LoginIcon /></ListItemIcon>
               <ListItemText primary="Ingresar" />
            </ListItem>
            <ListItem button component={RouterLink} to="/register">
               <ListItemIcon><AppRegistrationIcon /></ListItemIcon>
               <ListItemText primary="Registrarse" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>  
        {/* AppBar Transparente y Flotante */}
        <AppBar 
          position="absolute" 
          elevation={0} 
          sx={{ 
            // Hacemos el fondo gradualmente oscuro para que se lea el texto blanco
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', 
            pt: 1, 
            pb: 1,
            zIndex: 10 
          }}
        >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            
            {/* LOGO */}
            <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white' }}>
              <img src="/logo-blanco.png" alt="Logo" style={{ height: '35px', marginRight: '8px' }} onError={(e) => {e.target.onerror = null; e.target.style.display='none'}} /> 
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>EliteHomes</Typography>
            </Box>

            {/* MENÚ DESKTOP */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)', borderRadius: '30px', padding: '8px 25px', alignItems: 'center' }}>
              <Button component={RouterLink} to="/" sx={navLinkStyle}>Inicio</Button>
              {estaLogueado && (
                <>
                  <Button component={RouterLink} to="/favoritos" sx={navLinkStyle}>Favoritos</Button>
                  {(usuario?.rol === 'AGENTE' || usuario?.rol === 'ADMIN') ? (
                     <Button component={RouterLink} to="/mis-propiedades" sx={navLinkStyle}>Mis Propiedades</Button>
                  ) : (
                     <Button component={RouterLink} to="/solicitar-agente" sx={navLinkStyle}>Ser Agente</Button>
                  )}
                  {(usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPER_USUARIO') && (
                     <Button component={RouterLink} to="/admin" sx={{ ...navLinkStyle, color: '#ff8a80' }}>Admin</Button>
                  )}
                </>
              )}
            </Box>

            {/* ACCIONES DESKTOP */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
              {estaLogueado ? (
                <>
                  {(usuario?.rol === 'AGENTE' || usuario?.rol === 'ADMIN') && (
                    <Button component={RouterLink} to="/publicar" variant="contained" startIcon={<AddHomeIcon />} sx={{ backgroundColor: '#aeea00', color: '#000', fontWeight: 'bold', borderRadius: '8px', textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#c6ff00' } }}>
                      Nueva Propiedad
                    </Button>
                  )}
                  
                  {/* --- 2. AQUÍ ESTÁ EL CAMBIO DEL AVATAR --- */}
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '30px', padding: '4px 10px 4px 4px' }}>
                        <Avatar 
                          src={usuario?.foto_perfil} 
                          alt={usuario?.nombre} 
                          sx={{ width: 32, height: 32, bgcolor: '#ff9800' }}
                        >
                          {usuario?.nombre?.charAt(0).toUpperCase()}
                        </Avatar>
                        <KeyboardArrowDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                     </Box>
                  </IconButton>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" sx={{ color: 'white', fontWeight: 600 }}>Ingresar</Button>
                  <Button component={RouterLink} to="/register" variant="contained" sx={{ backgroundColor: '#aeea00', color: '#000', fontWeight: 'bold', borderRadius: '8px', textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#c6ff00' } }}>Registrarse</Button>
                </>
              )}
            </Box>

            {/* BOTÓN MÓVIL (Hamburguesa) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton size="large" onClick={handleDrawerToggle} sx={{ color: 'white' }}>
                <MenuIcon />
              </IconButton>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      {/* DRAWER MÓVIL (Menú lateral) */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MENÚ DESPLEGABLE USUARIO (Desktop) */}
      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose} PaperProps={{ elevation: 4, sx: { mt: 1.5, borderRadius: '12px', minWidth: '200px' } }}>
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{usuario?.nombre}</Typography>
          <Typography variant="caption" color="textSecondary">{usuario?.email}</Typography>
        </Box>
        <MenuItem component={RouterLink} to="/perfil" onClick={handleMenuClose} sx={{ my: 0.5 }}>
          {/* Avatar también en el menú desplegable */}
          <Avatar src={usuario?.foto_perfil} sx={{ width: 24, height: 24, mr: 1.5 }}>{usuario?.nombre?.charAt(0)}</Avatar>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}><LogoutIcon sx={{ fontSize: 20, mr: 1.5 }} /> Cerrar Sesión</MenuItem>
      </Menu>
    </>
  );
};

function App() {
  return (
    <Router>
      <CssBaseline />
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
        <NavBar />
        <Box component="main">
          <Routes>
             <Route path="/" element={<Catalogo />} />
             <Route path="/register" element={<Register />} />
             <Route path="/login" element={<Login />} />
             <Route path="/propiedad/:id" element={<PropiedadDetalle />} />
             <Route path="/perfil" element={<RutaProtegida><EditarPerfil /></RutaProtegida>} />
             <Route path="/favoritos" element={<RutaProtegida><MisFavoritos /></RutaProtegida>} />
             <Route path="/solicitar-agente" element={<RutaProtegida><SolicitarAgente /></RutaProtegida>} />
             <Route path="/publicar" element={<AgenteRuta><CrearPropiedad /></AgenteRuta>} />
             <Route path="/mis-propiedades" element={<AgenteRuta><MisPropiedades /></AgenteRuta>} />
             <Route path="/propiedad/editar/:id" element={<AgenteRuta><EditarPropiedad /></AgenteRuta>} />
             <Route path="/admin" element={<AdminRuta><AdminPanel /></AdminRuta>} />
          </Routes>
        </Box>
      </div>
    </Router>
  );
}

export default App;