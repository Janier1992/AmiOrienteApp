import { useEffect, useRef } from 'react';
import { deliveryService } from '@/services/deliveryService';
import { LOCATION_UPDATE_INTERVAL } from '@/lib/constants';

/**
 * Envía la ubicación del domiciliario SOLO mientras tiene una entrega en curso.
 *
 * Estar «conectado» no basta: sin pedido asignado no hay a quién mostrarle la posición, y
 * compartirla sería recolectar un dato personal sin necesidad (principio de minimización).
 * Al terminar la entrega, o al desconectarse, se detiene el envío y se libera el GPS.
 *
 * Limitación conocida: al ser una PWA, el navegador pausa el envío si la app queda en
 * segundo plano o con la pantalla apagada.
 *
 * @param {Object} opciones
 * @param {string} [opciones.userId] - UUID del domiciliario.
 * @param {boolean} opciones.conectado - Si el domiciliario se marcó como conectado.
 * @param {boolean} opciones.tieneEntregaEnCurso - Si tiene un pedido aceptado sin entregar.
 */
export const useDriverLocationSharing = ({ userId, conectado, tieneEntregaEnCurso }) => {
  const activo = Boolean(userId && conectado && tieneEntregaEnCurso);
  const cancelado = useRef(false);

  useEffect(() => {
    if (!activo || !navigator.geolocation) return undefined;
    cancelado.current = false;

    const enviar = () => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (cancelado.current) return;
          deliveryService
            .actualizarUbicacion(userId, coords.latitude, coords.longitude)
            .catch((error) => console.error('[ubicación] no se pudo enviar:', error));
        },
        (error) => console.error('[ubicación] no se pudo obtener:', error),
        { enableHighAccuracy: true },
      );
    };

    enviar();
    const intervalo = setInterval(enviar, LOCATION_UPDATE_INTERVAL);
    return () => {
      cancelado.current = true;
      clearInterval(intervalo);
    };
  }, [activo, userId]);
};
