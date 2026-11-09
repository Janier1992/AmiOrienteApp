import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/customSupabaseClient';
import { iconoDomiciliario } from '@/lib/mapIcons';
import { MAP_CONFIG } from '@/config/map';

const OrderTrackingMap = ({ delivery }) => {
  const [deliveryPersonLocation, setDeliveryPersonLocation] = useState(null);

  useEffect(() => {
    if (!delivery || !delivery.delivery_person_id) return;

    // Fetch initial location
    const fetchInitialLocation = async () => {
      const { data } = await supabase
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
  
  const hasDeliveryCoords = Array.isArray(delivery?.delivery_coords) && delivery.delivery_coords.length >= 2;
  const hasPickupCoords = Array.isArray(delivery?.pickup_coords) && delivery.pickup_coords.length >= 2;
  const personPosition = deliveryPersonLocation ? [deliveryPersonLocation.lat, deliveryPersonLocation.lng] : null;

  // Basta con saber dónde va el domiciliario o dónde se entrega; la recogida es opcional.
  if (!hasDeliveryCoords && !personPosition) {
    return <div className="text-center text-sm text-muted-foreground">Aún no tenemos la ubicación de tu domiciliario. Aparecerá aquí cuando comience a moverse.</div>;
  }

  const pickupPosition = hasPickupCoords ? [delivery.pickup_coords[0], delivery.pickup_coords[1]] : null;
  const deliveryPosition = hasDeliveryCoords ? [delivery.delivery_coords[0], delivery.delivery_coords[1]] : null;

  const centerPosition = personPosition || deliveryPosition;
  const routePositions = personPosition && deliveryPosition ? [personPosition, deliveryPosition] : [];

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <MapContainer center={centerPosition} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileUrl}
        />
        {pickupPosition && (
          <Marker position={pickupPosition}>
            <Popup>Punto de Recogida</Popup>
          </Marker>
        )}
        {deliveryPosition && (
          <Marker position={deliveryPosition}>
            <Popup>Tu Ubicación</Popup>
          </Marker>
        )}
        {personPosition && (
          <Marker position={personPosition} icon={iconoDomiciliario}>
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