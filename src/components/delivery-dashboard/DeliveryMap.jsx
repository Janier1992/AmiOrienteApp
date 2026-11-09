import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { crearIconoPin, iconoDomiciliario, COLORES_PIN } from '@/lib/mapIcons';
import { MAP_CONFIG } from '@/config/map';

const storeIcon = crearIconoPin(COLORES_PIN.tienda);
const customerIcon = crearIconoPin(COLORES_PIN.cliente);
const deliveryPersonIcon = iconoDomiciliario;

const MapUpdater = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

const DeliveryMap = ({ delivery }) => {
  const storePosition = delivery?.pickup_coords;
  const customerPosition = delivery?.delivery_coords;
  const deliveryPersonPosition = delivery?.delivery_person_location;

  const bounds = useMemo(() => {
    const points = [];
    if (storePosition) points.push(storePosition);
    if (customerPosition) points.push(customerPosition);
    if (deliveryPersonPosition) {
        points.push([deliveryPersonPosition.lat, deliveryPersonPosition.lng]);
    }
    if (points.length < 2) return null;
    return L.latLngBounds(points);
  }, [storePosition, customerPosition, deliveryPersonPosition]);

  const centerPosition = storePosition || [6.15515, -75.37367];

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden mt-4 border">
      <MapContainer center={centerPosition} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileUrl}
        />
        {storePosition && (
          <Marker position={storePosition} icon={storeIcon}>
            <Popup>Recoger aquí: {delivery?.pickup_address}</Popup>
          </Marker>
        )}
        {customerPosition && (
          <Marker position={customerPosition} icon={customerIcon}>
            <Popup>Entregar aquí: {delivery?.delivery_address}</Popup>
          </Marker>
        )}
        {deliveryPersonPosition && (
            <Marker position={[deliveryPersonPosition.lat, deliveryPersonPosition.lng]} icon={deliveryPersonIcon}>
                <Popup>Tu ubicación actual</Popup>
            </Marker>
        )}
        <MapUpdater bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;