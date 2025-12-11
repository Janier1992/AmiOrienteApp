import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/customSupabaseClient';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const deliveryPersonIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448620.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

const OrderTrackingMap = ({ delivery }) => {
  const [deliveryPersonLocation, setDeliveryPersonLocation] = useState(null);

  useEffect(() => {
    if (!delivery || !delivery.delivery_person_id) return;

    // Fetch initial location
    const fetchInitialLocation = async () => {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .eq('delivery_person_id', delivery.delivery_person_id)
        .single();
      
      if (data) {
        setDeliveryPersonLocation({ lat: data.lat, lng: data.lng });
      }
    };
    fetchInitialLocation();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`delivery-location-${delivery.delivery_person_id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'delivery_locations', 
          filter: `delivery_person_id=eq.${delivery.delivery_person_id}`
        },
        (payload) => {
          setDeliveryPersonLocation({ lat: payload.new.lat, lng: payload.new.lng });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [delivery]);
  
  if (!delivery?.delivery_coords || !delivery?.pickup_coords) {
    return <div className="text-center text-sm text-gray-500">No hay información de ubicación disponible para este pedido.</div>;
  }

  const pickupPosition = [delivery.pickup_coords[0], delivery.pickup_coords[1]];
  const deliveryPosition = [delivery.delivery_coords[0], delivery.delivery_coords[1]];
  const personPosition = deliveryPersonLocation ? [deliveryPersonLocation.lat, deliveryPersonLocation.lng] : null;

  const centerPosition = personPosition || deliveryPosition;
  const routePositions = personPosition ? [personPosition, deliveryPosition] : [];

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <MapContainer center={centerPosition} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pickupPosition}>
          <Popup>Punto de Recogida</Popup>
        </Marker>
        <Marker position={deliveryPosition}>
          <Popup>Tu Ubicación</Popup>
        </Marker>
        {personPosition && (
          <Marker position={personPosition} icon={deliveryPersonIcon}>
            <Popup>Domiciliario</Popup>
          </Marker>
        )}
        {routePositions.length > 0 && (
            <Polyline pathOptions={{ color: 'blue' }} positions={routePositions} />
        )}
      </MapContainer>
    </div>
  );
};

export default OrderTrackingMap;