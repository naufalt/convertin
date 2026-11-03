import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RadialMenu } from './components/RadialMenu';
import './index.css';

const isRadialMode = window.location.hash === '#radial';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isRadialMode ? <RadialMenu /> : <App />}
  </React.StrictMode>
);
