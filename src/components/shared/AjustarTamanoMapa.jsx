import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Hace que Leaflet recalcule el tamaño del mapa cada vez que cambia el de su contenedor.
 *
 * Dentro de un diálogo, el mapa se crea mientras el diálogo aún se está abriendo (con animación y
 * tamaño parcial) y, sin este ajuste, queda dibujado solo en una franja, con el marcador fuera de lugar.
 */
const AjustarTamanoMapa = () => {
  const map = useMap();

  useEffect(() => {
    const contenedor = map.getContainer();
    const observador = new ResizeObserver(() => map.invalidateSize());
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, [map]);

  return null;
};

export default AjustarTamanoMapa;
