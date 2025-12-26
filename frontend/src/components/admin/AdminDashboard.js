import React, { useState } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Toolbar, Typography, CssBaseline, Divider, Container 
} from '@mui/material';
import { People, MonetizationOn, ExitToApp } from '@mui/icons-material'; // Quitamos 'Dashboard' que no se usaba
import { useNavigate } from 'react-router-dom';

// Importamos tus componentes de gestión (Ahora deben estar en la misma carpeta)
import GestionAgentes from './GestionAgentes'; 
import GestionPlanes from './GestionPlanes';   

const drawerWidth = 240;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('agentes'); 
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
    window.location.reload();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* MENÚ LATERAL */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1a237e', color: 'white' },
        }}
      >
        <Toolbar>
            <Typography variant="h6" fontWeight="bold">Admin Panel</Typography>
        </Toolbar>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <List>
          <ListItem button onClick={() => setActiveTab('agentes')} sx={{ bgcolor: activeTab === 'agentes' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <ListItemIcon><People sx={{ color: 'white' }} /></ListItemIcon>
            <ListItemText primary="Agentes & Usuarios" />
          </ListItem>
          
          <ListItem button onClick={() => setActiveTab('planes')} sx={{ bgcolor: activeTab === 'planes' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            <ListItemIcon><MonetizationOn sx={{ color: 'white' }} /></ListItemIcon>
            <ListItemText primary="Planes & Precios" />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 'auto', p: 2 }}>
            <ListItem button onClick={handleLogout}>
                <ListItemIcon><ExitToApp sx={{ color: '#ff8a80' }} /></ListItemIcon>
                <ListItemText primary="Salir" sx={{ color: '#ff8a80' }} />
            </ListItem>
        </Box>
      </Drawer>

      {/* CONTENIDO PRINCIPAL */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        <Toolbar /> 
        
        <Container maxWidth="xl">
            {activeTab === 'agentes' && <GestionAgentes />}
            {activeTab === 'planes' && <GestionPlanes />}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;