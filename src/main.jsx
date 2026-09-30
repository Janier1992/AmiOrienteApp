
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './index.css';

// El registro del Service Worker lo inyecta vite-plugin-pwa (injectRegister: 'auto').

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </>
);
