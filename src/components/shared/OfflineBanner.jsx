
import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Persistent banner shown app-wide whenever the device loses network
 * connectivity, so users in low-signal areas (e.g. cultivadores en el
 * campo) get clear feedback instead of silent/confusing failures.
 */
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Sin conexión a internet. Algunos cambios no se guardarán hasta que vuelva la señal.</span>
    </div>
  );
};

export default OfflineBanner;
