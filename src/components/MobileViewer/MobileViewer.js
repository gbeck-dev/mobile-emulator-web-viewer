import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './MobileViewer.css';
import RFB from '@novnc/novnc/core/rfb';

/**
 * MobileViewer.css - Componente para conectar a emuladores Android mediante VNC
 * 
 * Este componente permite conectar a un emulador Android-x86 ejecutándose en un
 * servidor remoto mediante el protocolo VNC y la biblioteca noVNC.
 */
const MobileViewer = ({
  serverUrl,
  password = '',
  initialWidth = '360px',
  initialHeight = '640px',
  autoConnect = true,
  showControls = true,
  showConnectionStatus = true,
  showResizeControls = true,
  lock_size = false,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('desconectado');
  const [rfbConnection, setRfbConnection] = useState(null);
  const [error, setError] = useState(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });
  const [isLoading, setIsLoading] = useState(false);

  // Efecto para observar cambios en el tamaño del contenido
  useEffect(() => {
    if (contentSize.width > 0 && contentSize.height > 0) {
      if (containerRef.current) {
        const element = containerRef.current;
        element.scrollTop = contentSize.height;
        element.scrollLeft = contentSize.width;
      }
    }
  }, [contentSize]);

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: `${value}px`
    }));
  };

  const updateContentSize = () => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const newSize = {
          width: canvas.offsetWidth,
          height: canvas.offsetHeight
        };
        if (newSize.width !== contentSize.width || newSize.height !== contentSize.height) {
          setContentSize(newSize);
        }
      }
    }
  };

  const adjustScroll = () => {
    if (containerRef.current) {
      const element = containerRef.current;
      const canvas = element.querySelector('canvas');
      
      if (canvas) {
        updateContentSize();
        const needsScroll = canvas.offsetWidth > element.offsetWidth || 
                          canvas.offsetHeight > element.offsetHeight;
        
        if (needsScroll) {
          element.scrollTop = element.scrollHeight;
          element.scrollLeft = element.scrollWidth;
        }
      }
    }
  };

  const handleScrollToContent = () => {
    if (containerRef.current && contentSize.width > 0 && contentSize.height > 0) {
      const element = containerRef.current;
      element.scrollTop = contentSize.height;
      element.scrollLeft = contentSize.width;
    }
  };

  // Efecto para conectar al servidor VNC cuando el componente se monta
  useEffect(() => {
    if (!serverUrl || !autoConnect) return;

    connectToVNC();

    return () => {
      if (rfbConnection) {
        rfbConnection.disconnect();
      }
    };
  }, [serverUrl, autoConnect]);

  // Efecto para detectar y ajustar la posición del div interno
  useEffect(() => {
    const checkAndAdjustPosition = () => {
      const targetDiv = document.querySelector('.novnc-viewer .novnc-screen > div');
      if (targetDiv) {
        // Obtener dimensiones máximas
        const maxScrollLeft = targetDiv.scrollWidth - targetDiv.clientWidth;
        const maxScrollTop = targetDiv.scrollHeight - targetDiv.clientHeight;
        
        // Ajustar a la posición máxima
        targetDiv.scrollTo({
          left: maxScrollLeft,
          top: maxScrollTop - 5,
          behavior: 'instant'
        });
        
        // Eliminar scrolls
        targetDiv.style.overflow = 'hidden';
        targetDiv.style.setProperty('overflow', 'hidden', 'important');
        
        console.log('Scroll ajustado y eliminado:', {
          maxScrollLeft,
          maxScrollTop,
          currentScrollLeft: targetDiv.scrollLeft,
          currentScrollTop: targetDiv.scrollTop,
          overflow: targetDiv.style.overflow
        });
      }
    };

    // Crear observer para detectar cuando el div está disponible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        checkAndAdjustPosition();
      });
    });

    // Observar cambios en el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Limpiar observer
    return () => observer.disconnect();
  }, []);

  // Efecto para modificar el estilo del div interno y ajustar scroll
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const screen = document.querySelector('.novnc-screen');
          if (screen) {
            const innerDiv = screen.querySelector('div');
            if (innerDiv) {
              // Forzar overflow hidden
              // innerDiv.style.overflow = 'hidden';
              // innerDiv.style.setProperty('overflow', 'hidden', 'important');
              
              // Ajustar posición del scroll al máximo
              innerDiv.scrollTop = 600/2;
              innerDiv.scrollLeft = 390/2;
              console.log('innerDiv.scrollTop', innerDiv.scrollTop);
              console.log('innerDiv.scrollLeft', innerDiv.scrollLeft);

              console.log('innerDiv', innerDiv);

              // Forzar también con scroll position
              // innerDiv.style.setProperty('transform', `translate(-${innerDiv.scrollWidth/2}px, -${innerDiv.scrollHeight/2}px)`, 'important');
            }
          }
        }
      });
    });

    const screen = document.querySelector('.novnc-screen');
    if (screen) {
      observer.observe(screen, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Función para conectar al servidor VNC
  const connectToVNC = async () => {
    if (!serverUrl) return;

    try {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus('conectando');
      
      // Crear nueva instancia RFB
      const rfb = new RFB(
        containerRef.current,
        serverUrl,
        {
          credentials: { password },
          shared: true,
          wsProtocols: ['binary', 'base64']
        }
      );
      
      // Configurar eventos
      rfb.addEventListener('connect', () => {
        setConnectionStatus('conectado');
        setIsLoading(false);
        console.log('Conectado al emulador Android');
        setTimeout(updateContentSize, 100);
      });
      
      rfb.addEventListener('disconnect', (e) => {
        setConnectionStatus('desconectado');
        console.log('Desconectado del emulador Android', e);
      });
      
      rfb.addEventListener('credentialsrequired', () => {
        setConnectionStatus('requiere-credenciales');
        console.log('Se requieren credenciales');
      });
      
      rfb.addEventListener('securityfailure', (e) => {
        setConnectionStatus('error');
        setError('Error de seguridad: ' + (e.detail?.reason || 'Desconocido'));
        console.error('Fallo de seguridad:', e);
      });
      
      // Agregar evento para ajustar scroll cuando cambie el tamaño
      rfb.addEventListener('resize', () => {
        setTimeout(updateContentSize, 50);
      });
      
      setRfbConnection(rfb);
    } catch (err) {
      setConnectionStatus('error');
      setError(`Error al conectar: ${err.message}`);
      setIsLoading(false);
      console.error('Error al inicializar RFB:', err);
    }
  };

  // Función para desconectar
  const disconnect = () => {
    if (rfbConnection) {
      rfbConnection.disconnect();
      setConnectionStatus('desconectado');
    }
  };

  // Función para renderizar el estado de la conexión
  const renderConnectionStatus = () => {
    if (!showConnectionStatus) return null;
    
    switch (connectionStatus) {
      case 'conectando':
        return (
          <div className="novnc-status novnc-connecting">
            <div className="novnc-spinner"></div>
            <span>Conectando al emulador...</span>
          </div>
        );
      case 'conectado':
        return (
          <div className="novnc-status novnc-connected">
            <i className="fas fa-check-circle"></i>
            <span>Conectado al emulador Android</span>
          </div>
        );
      case 'desconectado':
        return (
          <div className="novnc-status novnc-disconnected">
            <i className="fas fa-plug"></i>
            <span>Desconectado</span>
          </div>
        );
      case 'requiere-credenciales':
        return (
          <div className="novnc-status novnc-credentials">
            <i className="fas fa-lock"></i>
            <span>Se requiere contraseña</span>
          </div>
        );
      case 'error':
        return (
          <div className="novnc-status novnc-error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error || 'Error de conexión'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleInstallApp = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/app/install', {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Error al instalar la app');
      console.log('App instalada correctamente');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUninstallApp = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/app/uninstall', {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Error al desinstalar la app');
      console.log('App desinstalada correctamente');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Función para renderizar controles
  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <div className="novnc-controls">
        {connectionStatus === 'desconectado' ? (
          <button 
            className="novnc-button novnc-connect-btn"
            onClick={connectToVNC}
            disabled={!serverUrl}
          >
            <i className="fas fa-play"></i> Conectar
          </button>
        ) : (
          <button 
            className="novnc-button novnc-disconnect-btn"
            onClick={disconnect}
            disabled={connectionStatus !== 'conectado'}
          >
            <i className="fas fa-stop"></i> Desconectar
          </button>
        )}
        
        <button 
          className="novnc-button novnc-install-btn"
          onClick={handleInstallApp}
          disabled={connectionStatus !== 'conectado'}
        >
          <i className="fas fa-download"></i> Install App
        </button>

        <button 
          className="novnc-button novnc-uninstall-btn"
          onClick={handleUninstallApp}
          disabled={connectionStatus !== 'conectado'}
        >
          <i className="fas fa-trash"></i> Desinstalar App
        </button>

        <button 
          className="novnc-button novnc-check-btn"
          onClick={() => console.log('Revisar app')}
          disabled={connectionStatus !== 'conectado'}
        >
          <i className="fas fa-search"></i> Revisar App
        </button>
        
        <button 
          className="novnc-button"
          disabled={true}
        >
          <i className="fas fa-external-link-alt"></i> Abrir en nueva ventana
        </button>
      </div>
    );
  };

  // Agregar renderizado de controles de redimensionamiento
  const renderResizeControls = () => {
    if (!showResizeControls) return null;
    
    return (
      <div className="novnc-resize-controls">
        <div className="novnc-dimension-control">
          <label htmlFor="width">Ancho:</label>
          <input
            type="number"
            id="width"
            name="width"
            value={parseInt(dimensions.width)}
            onChange={handleDimensionChange}
            min="200"
            max="1920"
            disabled={lock_size}
          />
          <span>px</span>
        </div>
        <div className="novnc-dimension-control">
          <label htmlFor="height">Alto:</label>
          <input
            type="number"
            id="height"
            name="height"
            value={parseInt(dimensions.height)}
            onChange={handleDimensionChange}
            min="200"
            max="1920"
            disabled={lock_size}
          />
          <span>px</span>
        </div>
        <div className="novnc-size-info">
          <span>Contenido: {contentSize.width}x{contentSize.height}px</span>
          <button 
            className="novnc-scroll-button"
            onClick={handleScrollToContent}
            disabled={contentSize.width === 0 || contentSize.height === 0}
          >
            <i className="fas fa-arrows-alt"></i> Ajustar scroll
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`novnc-container ${className} d-flex align-items-center justify-content-center`}>
      {renderConnectionStatus()}
      {renderResizeControls()}
      
      <div 
        className="novnc-viewer my-4 py-4"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div 
          ref={containerRef} 
          className="novnc-screen"
        >
          {(connectionStatus === 'desconectado' || isLoading) && (
            <div className="novnc-loading-message">
              {isLoading ? (
                <>
                  <div className="android-emulator-loading-spinner"></div>
                  <p>Conectando al emulador Android...</p>
                </>
              ) : (
                <>
                  <div className="novnc-loading-icon">
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                  <p>Esperando conexión...</p>
                  {!autoConnect && (
                    <button 
                      className="novnc-button novnc-connect-btn"
                      onClick={connectToVNC}
                    >
                      Conectar
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {renderControls()}
    </div>
  );
};

MobileViewer.propTypes = {
  /** URL del servidor WebSocket VNC (ej: ws://servidor:puerto/websockify) */
  serverUrl: PropTypes.string.isRequired,
  /** Contraseña para la conexión VNC */
  password: PropTypes.string,
  /** Ancho inicial del visor */
  initialWidth: PropTypes.string,
  /** Altura inicial del visor */
  initialHeight: PropTypes.string,
  /** Conectar automáticamente al montar el componente */
  autoConnect: PropTypes.bool,
  /** Mostrar controles (botones de conexión) */
  showControls: PropTypes.bool,
  /** Mostrar estado de la conexión */
  showConnectionStatus: PropTypes.bool,
  /** Mostrar controles de redimensionamiento */
  showResizeControls: PropTypes.bool,
  /** Clase CSS adicional */
  className: PropTypes.string,
  /** Bloquear el tamaño del visor */
  lock_size: PropTypes.bool
};

export default MobileViewer; 