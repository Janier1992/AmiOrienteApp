
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './index.css';

// Service worker registration is handled automatically by vite-plugin-pwa
// (injectRegister: 'auto' in vite.config.js) — no manual registration needed.

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </>
);
