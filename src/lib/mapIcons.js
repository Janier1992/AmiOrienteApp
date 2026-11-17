import L from 'leaflet';
import iconoPorDefecto from 'leaflet/dist/images/marker-icon.png';
import iconoPorDefecto2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombra from 'leaflet/dist/images/marker-shadow.png';

/**
 * Íconos de los mapas, todos propios o incluidos en el paquete de Leaflet (BSD-2): no se cargan
 * imágenes de terceros por internet (antes: cdnjs, GitHub y Flaticon, este último con atribución obligatoria).
 */

// Con Vite, Leaflet no encuentra solo sus imágenes: se le indican las del paquete.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: iconoPorDefecto, iconRetinaUrl: iconoPorDefecto2x, shadowUrl: sombra });

/** Alfiler de color dibujado en SVG (misma forma y tamaño que el de Leaflet). */
export const crearIconoPin = (color) => L.divIcon({
  className: 'ami-pin',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41" aria-hidden="true"><path d="M12.5 1C6 1 1 6 1 12.5 1 21 12.5 40 12.5 40S24 21 24 12.5C24 6 19 1 12.5 1z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/><circle cx="12.5" cy="12.5" r="4.5" fill="#ffffff"/></svg>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

/** Insignia redonda con una moto, para el domiciliario. */
export const iconoDomiciliario = L.divIcon({
  className: 'ami-domiciliario',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="17" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="23" r="3.5"/><circle cx="25" cy="23" r="3.5"/><path d="M11 23l4-8h5M15 15l3 8h7M20 15l2-3h3"/></g></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const COLORES_PIN = { tienda: '#2563eb', cliente: '#16a34a' };
