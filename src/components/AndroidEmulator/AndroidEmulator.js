import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './AndroidEmulator.css';
import RFB from '@novnc/novnc/core/rfb';

/**
 * AndroidEmulator - Componente para conectar a un emulador Android mediante noVNC
 * 
 * Este componente simplificado conecta a un emulador Android-x86 mediante VNC.
 */
const AndroidEmulator = ({
  serverUrl = 'ws://tu-servidor-android-x86-novnc:port/websockify',
  password = '',
  width = '360px',
  height = '640px'
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!serverUrl) return;
    
    // Inicializar conexión VNC
    try {
      const rfb = new RFB(
        containerRef.current,
        serverUrl,
        {
          credentials: { password }
        }
      );
      
      // Manejar eventos del emulador
      rfb.addEventListener('connect', () => console.log('Conectado al emulador Android'));
      rfb.addEventListener('disconnect', () => console.log('Desconectado del emulador Android'));
      rfb.addEventListener('credentialsrequired', () => console.log('Se requieren credenciales'));
      
      return () => {
        // Limpiar al desmontar
        if (rfb) {
          rfb.disconnect();
        }
      };
    } catch (error) {
      console.error('Error al conectar al emulador Android:', error);
    }
  }, [serverUrl, password]);

  return (
    <div className="android-emulator-container">
      <div 
        ref={containerRef} 
        className="android-emulator-screen"
        style={{ width, height }}
      >
        <div className="android-emulator-loading">
          <div className="android-emulator-loading-spinner"></div>
          <p>Conectando al emulador Android...</p>
        </div>
      </div>
    </div>
  );
};

AndroidEmulator.propTypes = {
  /** URL del servidor WebSocket VNC */
  serverUrl: PropTypes.string,
  /** Contraseña para la conexión VNC (si es necesaria) */
  password: PropTypes.string,
  /** Ancho del emulador */
  width: PropTypes.string,
  /** Altura del emulador */
  height: PropTypes.string
};

export default AndroidEmulator; 