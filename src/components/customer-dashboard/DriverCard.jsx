import React, { useEffect, useState } from 'react';
import { Bike, Car, Footprints, ShieldCheck, User } from 'lucide-react';
import { deliveryService } from '@/services/deliveryService';
import { VEHICLE_LABELS } from '@/lib/driverPhoto';

const VehicleIcon = ({ type }) => {
  if (type === 'carro') return <Car className="h-4 w-4" aria-hidden="true" />;
  if (type === 'pie') return <Footprints className="h-4 w-4" aria-hidden="true" />;
  return <Bike className="h-4 w-4" aria-hidden="true" />;
};

/**
 * Quién te lleva el pedido: foto, nombre completo, documento (enmascarado) y placa.
 * Se muestra mientras el pedido está en camino y en su detalle.
 */
const DriverCard = ({ orderId, className = '' }) => {
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    let active = true;
    deliveryService
      .obtenerDomiciliarioDelPedido(orderId)
      .then((d) => active && setDriver(d))
      .catch(() => active && setDriver(null));
    return () => { active = false; };
  }, [orderId]);

  if (!driver) return null;

  return (
    <div className={`flex items-center gap-4 rounded-xl border bg-card p-3 ${className}`} data-testid="driver-card">
      {driver.photo_jpeg ? (
        <img src={driver.photo_jpeg} alt={`Foto de ${driver.full_name}`} className="h-20 w-20 shrink-0 rounded-full border-2 border-primary/30 object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted"><User className="h-8 w-8 text-muted-foreground" aria-hidden="true" /></div>
      )}
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Tu domiciliario
        </p>
        <p className="truncate text-lg font-bold">{driver.full_name}</p>
        {driver.document_masked && <p className="text-sm text-muted-foreground">Documento: {driver.document_masked}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {driver.plate ? (
            <span className="rounded border-2 border-yellow-500 bg-yellow-300 px-2 py-0.5 font-mono font-bold tracking-widest text-black" aria-label={`Placa ${driver.plate}`}>{driver.plate}</span>
          ) : null}
          {driver.vehicle_type && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <VehicleIcon type={driver.vehicle_type} /> {VEHICLE_LABELS[driver.vehicle_type] || driver.vehicle_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverCard;
