// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Importamos el Navbar desde su nuevo archivo
import Navbar from './components/Navbar';

import MiPlan from './components/agente/MiPlan';
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
import AdminPanel from './components/admin/AdminPanel';
import MisPropiedades from './components/MisPropiedades';
import EditarPropiedad from './components/EditarPropiedad';
import Perfil from './components/Perfil';

import AdminDashboard from './components/admin/AdminDashboard';
import Planes from './components/Planes';
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
            <Route path="/mi-plan" element={<AgenteRuta> <MiPlan /></AgenteRuta>} />

<Route path="/admin" element={
    <AdminRuta> {/* Asegúrate de tener este componente de protección para rol ADMIN */}
        <AdminDashboard />
    </AdminRuta>
} />
             <Route path="/" element={<Catalogo />} />
             <Route path="/register" element={<Register />} />
             <Route path="/login" element={<Login />} />
             <Route path="/propiedad/:id" element={<PropiedadDetalle />} />
             <Route path="/perfil" element={<Perfil />} />
             <Route path="/favoritos" element={<RutaProtegida><MisFavoritos /></RutaProtegida>} />
             <Route path="/planes" element={<Planes />} />
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