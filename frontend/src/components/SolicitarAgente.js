// src/components/SolicitarAgente.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SolicitarAgente = () => {
  // Leemos el estado actual del usuario desde localStorage
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario')));
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkWhatsApp, setLinkWhatsApp] = useState('');

  // Función para llamar a la API de solicitud
  const handleSolicitud = async () => {
    setLoading(true);
    setMensaje('');
    setLinkWhatsApp('');
    const token = localStorage.getItem('token');

    try {
      // 1. Llamamos al endpoint que cambia nuestro estado a PENDIENTE
      const res = await axios.post(
        'http://localhost:5000/api/usuarios/me/solicitar-agente',
        {}, // No necesita body
        { headers: { 'x-auth-token': token } }
      );

      // 2. Si todo sale bien, actualizamos el estado local
      setMensaje(res.data.msg);

      // Actualizamos el 'usuario' en localStorage para que refleje el nuevo estado
      // (Aunque el backend no lo devuelve, sabemos que cambió)
      // *Idealmente, el backend debería devolver el usuario actualizado*
      // Por ahora, actualizamos manualmente el estado del componente:
      setUsuario(prev => ({ ...prev, estado_agente: 'PENDIENTE' }));

      // 3. Ahora que estamos PENDIENTES, buscamos el tel. del admin
      const configRes = await axios.get('http://localhost:5000/api/configuracion');
      const telefonoAdmin = configRes.data.telefono_admin_whatsapp;

      // 4. Creamos el enlace de WhatsApp
      const textoMensaje = encodeURIComponent(`Hola, acabo de enviar mi solicitud en la plataforma para ser Agente. Mi email es ${usuario.email}.`);
      setLinkWhatsApp(`https://wa.me/${telefonoAdmin}?text=${textoMensaje}`);

    } catch (err) {
      // El backend nos dirá si ya somos AGENTE o si ya estamos PENDIENTE
      setMensaje(`Error: ${err.response.data.msg}`);
    }
    setLoading(false);
  };

  // Renderizado condicional basado en el estado del usuario
  const renderContent = () => {
    if (!usuario) return <p>Debes estar logueado.</p>;

    switch (usuario.estado_agente) {
      case 'NO_SOLICITADO':
        return (
          <div>
            <h3>¡Conviértete en Agente!</h3>
            <p>Publica tus propiedades en nuestra plataforma. Envía una solicitud y un administrador la revisará.</p>
            <button onClick={handleSolicitud} disabled={loading}>
              {loading ? 'Enviando...' : 'Solicitar ser Agente'}
            </button>
          </div>
        );
      case 'PENDIENTE':
        return (
          <div>
            <h3>¡Solicitud Enviada!</h3>
            <p>Tu solicitud está **PENDIENTE** de aprobación.</p>
            {linkWhatsApp && (
              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', padding: '10px 15px', 
                background: 'green', color: 'white', textDecoration: 'none', borderRadius: '5px'
              }}>
                Contactar al Admin por WhatsApp para agilizar
              </a>
            )}
            <p style={{marginTop: '10px'}}>{mensaje}</p> 
          </div>
        );
      case 'APROBADO':
        return (
          <div>
            <h3>¡Felicidades!</h3>
            <p>Tu solicitud fue **APROBADA**. Ya eres Agente.</p>
            <p>Ahora puedes ver el enlace "Publicar Propiedad" en la navegación.</p>
          </div>
        );
      case 'RECHAZADO':
        return (
          <div>
            <h3>Solicitud Rechazada</h3>
            <p>Tu solicitud fue rechazada. Contacta a soporte para más información.</p>
          </div>
        );
      default:
        return null; // En caso de 'ADMIN', etc.
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      {renderContent()}
      {mensaje && !linkWhatsApp && (
        <p style={{ marginTop: '15px', color: mensaje.startsWith('Error') ? 'red' : 'green' }}>
          {mensaje}
        </p>
      )}
    </div>
  );
};

export default SolicitarAgente;