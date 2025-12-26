import React, { useState, useEffect } from 'react';
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Button, Chip } from '@mui/material';
import { Favorite, FavoriteBorder, LocationOn, BedOutlined, BathtubOutlined, SquareFoot } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const PropiedadCard = ({ propiedad, onLike }) => {
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(propiedad.is_favorited);

  useEffect(() => {
    setIsFavoritedLocal(propiedad.is_favorited);
  }, [propiedad.is_favorited]);

  const handleToggleFavorite = (event) => {
    event.preventDefault(); // Evita que el link de la tarjeta se active
    event.stopPropagation();
    if (onLike) {
        onLike(propiedad.id);
    }
    setIsFavoritedLocal(prev => !prev);
  };

  const formattedPrice = new Intl.NumberFormat('es-EC', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(propiedad.precio);

  return (
    <Card
      sx={{
        width: 340,      // 👈 ANCHO FIJO
        maxWidth: 340,
        height: '100%', // IMPORTANTE: Ocupa toda la altura disponible del contenedor padre
        display: 'flex', // Activa Flexbox para la tarjeta
        flexDirection: 'column', // Organiza los hijos en columna
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: '0.3s',
        position: 'relative',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
      }}
    >
      {/* Chip de Operación (Venta/Arriendo) */}
      <Chip
        label={propiedad.operacion}
        size="small"
        color={propiedad.operacion === 'Venta' ? 'primary' : 'secondary'}
        sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 'bold', zIndex: 2 }}
      />

      {/* Botón de Favorito */}
      <IconButton
        onClick={handleToggleFavorite}
        sx={{
          position: 'absolute', top: 5, right: 5,
          bgcolor: 'rgba(255,255,255,0.8)',
          color: isFavoritedLocal ? '#d32f2f' : '#757575',
          zIndex: 2,
          '&:hover': { bgcolor: 'white' }
        }}
      >
        {isFavoritedLocal ? <Favorite /> : <FavoriteBorder />}
      </IconButton>

      {/* Enlace principal que envuelve la imagen y el contenido */}
      <Link to={`/propiedad/${propiedad.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <CardMedia
          component="img"
          height="200" // Altura fija para la imagen
          image={propiedad.foto_principal || 'https://via.placeholder.com/400x250?text=Sin+Imagen'}
          alt={propiedad.titulo}
          sx={{ objectFit: 'cover' }}
        />

        <CardContent sx={{
            p: 2,
            flexGrow: 1, // IMPORTANTE: Hace que este contenedor ocupe el espacio restante
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between' // Distribuye el espacio entre el contenido superior y el inferior
        }}>
          {/* Contenido Superior (Título, Ubicación, Características) */}
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{
                mb: 1,
                lineHeight: 1.2,
                height: '2.4em', // Altura fija para 2 líneas de texto
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
               WebkitLineClamp: 2, // <--- CORREGIDO
                WebkitBoxOrient: 'vertical' // <--- CORREGIDO
            }}>
              {propiedad.titulo}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
              <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" noWrap>
                {propiedad.ciudad}, {propiedad.provincia}
              </Typography>
            </Box>

            {/* Iconos de características */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, color: 'text.secondary' }}>
              {propiedad.habitaciones > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BedOutlined fontSize="small" /> <Typography variant="caption">{propiedad.habitaciones}</Typography>
                </Box>
              )}
              {propiedad.banos > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BathtubOutlined fontSize="small" /> <Typography variant="caption">{propiedad.banos}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SquareFoot fontSize="small" /> <Typography variant="caption">{propiedad.area_m2} m²</Typography>
              </Box>
            </Box>
          </Box>

          {/* Contenido Inferior (Precio y Botón) - Siempre al fondo */}
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
              {formattedPrice}
            </Typography>
            <Button variant="contained" fullWidth sx={{ textTransform: 'none', fontWeight: 'bold' }}>
              Ver Detalles
            </Button>
          </Box>
        </CardContent>
      </Link>
    </Card>
  );
};

export default PropiedadCard;