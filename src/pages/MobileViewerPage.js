import React, { useState } from 'react';
import MobileViewer from '../components/MobileViewer';
import AndroidEmulator from '../components/AndroidEmulator';

const MobileViewerPage = () => {
  const [config, setConfig] = useState({
    serverUrl: process.env.REACT_APP_ServerURL,
    password: process.env.REACT_APP_Password,
    useSimpleEmulator: false
  });

  return (
    <div className="container py-2">
      <h1 className="text-center mb-2">Emulador Android - Web Viewer</h1>
      <p className="lead text-center mb-3">
        Conecta a un emulador Android-x86 usando WebSockets
      </p>
      <div className="row">
        <div className="col-lg-8 offset-lg-2">
          <div className="card shadow mb-2">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {config.useSimpleEmulator ? 'Emulador Simple' : 'Emulador Completo'}
              </h5>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="switchEmulator"
                  checked={config.useSimpleEmulator}
                  onChange={(e) => setConfig({ ...config, useSimpleEmulator: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="switchEmulator">
                  Versión simple
                </label>
              </div>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center p-2" style={{ minHeight: '600px' }}>
              {config.useSimpleEmulator ? (
                <AndroidEmulator
                  serverUrl={config.serverUrl}
                  password={config.password}
                  width="360px"
                  height="640px"
                />
              ) : (
                <MobileViewer
                  serverUrl={config.serverUrl}
                  password={config.password}
                  initialWidth="290px"
                  initialHeight="520px"
                  autoConnect={false}
                  showControls={true}
                  showConnectionStatus={true}
                  lock_size={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileViewerPage; 