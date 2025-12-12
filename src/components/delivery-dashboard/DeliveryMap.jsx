import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliveryPersonIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', // Changed to red for contrast
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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