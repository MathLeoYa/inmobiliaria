import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  IconButton, Badge, Menu, MenuItem, ListItemText, Typography, Box, Divider 
} from '@mui/material';
import { Notifications, CheckCircle, Error, Info } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotificationMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Cargar notificaciones (Polling simple: cada 60 seg actualiza, o solo al montar)
  // Para MVP, cargar al montar y al abrir el menú está bien.
  const fetchNotificaciones = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/notificaciones', {
        headers: { 'x-auth-token': token }
      });
      setNotificaciones(res.data);
      setUnreadCount(res.data.filter(n => !n.leido).length);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchNotificaciones(); }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Al abrir, marcamos como leídas visualmente (o llamamos al backend aquí)
    if (unreadCount > 0) {
        axios.put('http://localhost:5000/api/notificaciones/marcar-leidas', {}, { headers: { 'x-auth-token': token } });
        setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (link) => {
      if (link) navigate(link);
      handleClose();
  };

  const getIcon = (tipo) => {
      switch(tipo) {
          case 'success': return <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />;
          case 'error': return <Error fontSize="small" color="error" sx={{ mr: 1 }} />;
          default: return <Info fontSize="small" color="info" sx={{ mr: 1 }} />;
      }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
            elevation: 4,
            sx: { width: 320, maxHeight: 400, borderRadius: '12px', mt: 1.5 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight="bold">Notificaciones</Typography>
        </Box>
        <Divider />
        
        {notificaciones.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: '#888' }}>
                <Typography variant="body2">No tienes notificaciones nuevas.</Typography>
            </Box>
        ) : (
            notificaciones.map((notif) => (
                <MenuItem 
                    key={notif.id} 
                    onClick={() => handleNavigate(notif.enlace)}
                    sx={{ 
                        whiteSpace: 'normal', 
                        bgcolor: notif.leido ? 'transparent' : '#f0f7ff',
                        borderBottom: '1px solid #f5f5f5' 
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ mt: 0.5 }}>{getIcon(notif.tipo)}</Box>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: notif.leido ? 'normal' : 'bold' }}>
                                {notif.mensaje}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {new Date(notif.fecha_creacion).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                </MenuItem>
            ))
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu;