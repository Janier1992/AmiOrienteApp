import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartSidebarProvider } from '@/contexts/CartSidebarContext';
import './index.css';
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Recargar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <CartSidebarProvider>
            <App />
          </CartSidebarProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </>
);
