// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Importamos el Navbar desde su nuevo archivo
import Navbar from './components/Navbar';

// Componentes (Páginas)
import Catalogo from './components/Catalogo';
import Register from './components/Register'; // Aún lo necesitamos por si entran directo a /register
import Login from './components/Login';       // Aún lo necesitamos por si entran directo a /login
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

function App() {
  return (
    <Router>
      <CssBaseline />
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
        
        {/* Aquí está el Navbar limpio */}
        <Navbar />
        
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