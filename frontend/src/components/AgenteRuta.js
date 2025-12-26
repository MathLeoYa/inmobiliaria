import React from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Container, Button } from '@mui/material';

const AgenteRuta = ({ children }) => {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  // 1. Si no hay login, manda a login
  if (!token || !usuario) {
    return <Navigate to="/login" />;
  }

  // 2. Si no es Agente ni Admin, manda a solicitar
  if (usuario.rol !== 'AGENTE' && usuario.rol !== 'ADMIN') {
    return <Navigate to="/solicitar-agente" />;
  }

  // 3. --- NUEVO: SI ESTÁ SUSPENDIDO ---
  if (usuario.estado_agente === 'SUSPENDIDO') {
      return (
        <Container sx={{ mt: 10 }}>
            <Alert severity="error" variant="filled" 
                action={
                    <Button color="inherit" size="small" href="/mis-propiedades">
                        Ver Detalles
                    </Button>
                }
            >
                ⛔ ACCESO DENEGADO: Tu cuenta de agente está <strong>SUSPENDIDA</strong>.
            </Alert>
        </Container>
      );
  }

  return children;
};

export default AgenteRuta;