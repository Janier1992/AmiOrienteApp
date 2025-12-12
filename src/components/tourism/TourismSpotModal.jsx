import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { X, Phone, Globe, Star, BedDouble, UtensilsCrossed, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HotelBookingForm from './HotelBookingForm';
import FoodOrderingForm from './FoodOrderingForm';

const TourismSpotModal = ({ spot, isOpen, onClose }) => {
  const [actionMode, setActionMode] = useState(null); // 'booking' | 'ordering' | null

  useEffect(() => {
    setActionMode(null);
  }, [spot]);

  if (!spot) return null;

  // Default to Marinilla coordinates if none provided
  const position = [spot.latitude || 6.17, spot.longitude || -75.33];
  const isHotel = spot.category_name === 'Hoteles';
  const isRestaurant = spot.category_name === 'Restaurantes';

  const handleGoogleMaps = () => {
    // Opens Google Maps Directions in a new tab
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col md:flex-row bg-white">
        
        {/* Left Side: Image & Title */}
        <div className="w-full md:w-5/12 relative h-48 md:h-auto shrink-0">
          <img 
            alt={spot.name}
            className="h-full w-full object-cover"
            src={spot.image_urls?.[0] || "https://images.unsplash.com/photo-1702403847682-160bc0851819"} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-bold leading-tight mb-1">{spot.name}</h2>
            <p className="text-sm opacity-90 truncate flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {spot.address}
            </p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-7/12 p-6 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
             <div className="flex gap-2 text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full w-fit items-center">
                {isHotel && <BedDouble className="h-4 w-4" />}
                {isRestaurant && <UtensilsCrossed className="h-4 w-4" />}
                {!isHotel && !isRestaurant && <Star className="h-4 w-4" />}
                {spot.category_name || 'Turismo'}
             </div>
             <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 -mt-2 h-8 w-8 rounded-full">
               <X className="h-4 w-4" />
             </Button>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {spot.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {spot.contact_phone && (
              <a href={`tel:${spot.contact_phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded border bg-slate-50 hover:bg-slate-100">
                <Phone className="h-4 w-4 text-primary" />
                <span className="truncate">Llamar</span>
              </a>
            )}
            {spot.website && (
              <a href={spot.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded border bg-slate-50 hover:bg-slate-100">
                <Globe className="h-4 w-4 text-primary" />
                <span className="truncate">Sitio Web</span>
              </a>
            )}
            <Button 
              variant="outline" 
              className="col-span-2 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={handleGoogleMaps}
            >
              <Navigation className="h-4 w-4" />
              Ver ubicación en Google Maps
            </Button>
          </div>

          {/* Action Buttons */}
          {!actionMode && (
            <div className="flex gap-3 mb-6">
              {isHotel && (
                <Button onClick={() => setActionMode('booking')} className="w-full">
                  <BedDouble className="mr-2 h-4 w-4" />
                  Reservar Ahora
                </Button>
              )}
              {isRestaurant && (
                <Button onClick={() => setActionMode('ordering')} className="w-full">
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  Pedir a Domicilio
                </Button>
              )}
            </div>
          )}

          {/* Interactive Forms */}
          {actionMode === 'booking' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-sm">Formulario de Reserva</h4>
                  <Button variant="ghost" size="sm" onClick={() => setActionMode(null)} className="h-6 text-xs text-muted-foreground">Cancelar</Button>
                </div>
                <HotelBookingForm hotelName={spot.name} onClose={() => { setActionMode(null); onClose(); }} />
             </div>
          )}

          {actionMode === 'ordering' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-sm">Menú Domicilios</h4>
                  <Button variant="ghost" size="sm" onClick={() => setActionMode(null)} className="h-6 text-xs text-muted-foreground">Cancelar</Button>
                </div>
                <FoodOrderingForm restaurantName={spot.name} onClose={() => { setActionMode(null); onClose(); }} />
             </div>
          )}

          {/* Map Section */}
          {!actionMode && (
            <div className="mt-auto pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Ubicación</p>
              <div className="h-48 w-full rounded-lg overflow-hidden border bg-slate-100 relative z-0">
                <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position}>
                    <Popup>{spot.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourismSpotModal;