
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './index.css';

import { checkManifest, registerServiceWorker } from '@/lib/pwaUtils';

// --- PWA Debugging & Registration Suite ---
checkManifest();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </>
);
