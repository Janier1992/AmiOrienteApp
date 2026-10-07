import { useEffect } from 'react';

/**
 * Fuerza el tema claro mientras el componente está montado.
 *
 * Los paneles de administración (tienda, admin) están diseñados con fondos
 * claros fijos; con el tema oscuro mezclaban fondos claros con tarjetas y
 * diálogos negros. No cambia la preferencia guardada del usuario: al salir
 * del panel se restaura la clase de tema que corresponda.
 */
export const useForcedLightTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      let saved = 'light';
      try {
        saved = localStorage.getItem('theme') || 'light';
      } catch {
        // localStorage no disponible: queda el tema claro
      }
      root.classList.remove('light', 'dark');
      root.classList.add(saved === 'dark' ? 'dark' : 'light');
    };
  }, []);
};
