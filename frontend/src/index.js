import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 1. Importar el Provider
import { GoogleOAuthProvider } from '@react-oauth/google'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 2. Envolver la App con el Client ID de tu .env */}
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);