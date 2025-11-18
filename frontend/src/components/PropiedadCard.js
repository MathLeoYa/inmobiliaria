// src/components/PropiedadCard.js
import React, { useState, useEffect } from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Chip, Button } from '@mui/material';
import { Favorite, FavoriteBorder, BathtubOutlined, BedOutlined, SquareFoot } from '@mui/icons-material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link } from 'react-router-dom';

const PropiedadCard = ({ propiedad, onLike }) => {
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(propiedad.is_favorited);

  useEffect(() => {
    setIsFavoritedLocal(propiedad.is_favorited);
  }, [propiedad.is_favorited]);

  const handleToggleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onLike(propiedad.id);
    setIsFavoritedLocal(prev => !prev);
  };

  const formattedPrice = new Intl.NumberFormat('es-EC', { 
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(propiedad.precio);

  const ubicacionTexto = [propiedad.ciudad, propiedad.provincia].filter(Boolean).join(', ');

  return (
    <Card 
      sx={{ 
        width: 300, // Ancho fijo para el estilo vertical compacto
        borderRadius: '16px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease-in-out',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      <Link to={`/propiedad/${propiedad.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box sx={{ position: 'relative' }}>
          
          {/* IMAGEN */}
          <CardMedia
            component="img"
            height="200"
            image={propiedad.foto_principal || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}
            alt={propiedad.titulo}
            sx={{ objectFit: 'cover' }}
          />

          {/* CORAZÓN (Círculo Blanco) */}
          <IconButton 
            onClick={handleToggleFavorite}
            sx={{ 
              position: 'absolute', top: 10, right: 10, 
              backgroundColor: 'white',
              color: isFavoritedLocal ? '#FF4500' : '#888',
              '&:hover': { backgroundColor: '#f5f5f5' },
              width: 32, height: 32,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            size="small"
          >
            {isFavoritedLocal ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
        </Box>

        <CardContent sx={{ padding: '16px', pb: '16px !important' }}>
          
          {/* TIPO + OPERACIÓN (Ej. Casa - Arriendo) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: '#666' }}>
             <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
               {propiedad.tipo} • {propiedad.operacion}
             </Typography>
          </Box>

          {/* TÍTULO */}
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2, height: '44px', overflow: 'hidden' }}>
            {propiedad.titulo}
          </Typography>

          {/* UBICACIÓN */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#888' }}>
            <LocationOnIcon sx={{ fontSize: 14, mr: 0.5, color: '#1976d2' }} />
            <Typography variant="caption" noWrap>
              {ubicacionTexto || 'Ubicación no especificada'}
            </Typography>
          </Box>

          {/* PRECIO */}
          <Typography variant="h5" component="div" sx={{ fontWeight: 800, color: '#1976d2', mb: 2 }}>
            {formattedPrice}
          </Typography>
          
          {/* BOTÓN VER DETALLES (Estilo Azul Sólido) */}
          <Button 
             variant="contained" 
             fullWidth 
             disableElevation
             sx={{ 
               backgroundColor: '#1976d2', 
               color: 'white', 
               fontWeight: 'bold',
               textTransform: 'none',
               borderRadius: '8px',
               py: 1,
               '&:hover': { backgroundColor: '#1565c0' }
             }}
          >
            Ver Detalles
          </Button>

        </CardContent>
      </Link>
    </Card>
  );
};

export default PropiedadCard;