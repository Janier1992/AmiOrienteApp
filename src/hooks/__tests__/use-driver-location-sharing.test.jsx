import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDriverLocationSharing } from '../use-driver-location-sharing';
import { deliveryService } from '@/services/deliveryService';
import { LOCATION_UPDATE_INTERVAL } from '@/lib/constants';

vi.mock('@/services/deliveryService', () => ({
  deliveryService: { actualizarUbicacion: vi.fn() },
}));

const getCurrentPosition = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  deliveryService.actualizarUbicacion.mockResolvedValue();
  getCurrentPosition.mockImplementation((ok) => ok({ coords: { latitude: 6.1, longitude: -75.4 } }));
  Object.defineProperty(global.navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
});
afterEach(() => vi.useRealTimers());

const montar = (props) => renderHook((p) => useDriverLocationSharing(p), { initialProps: props });

describe('useDriverLocationSharing', () => {
  it('no comparte la ubicación si está conectado pero sin entrega en curso', () => {
    montar({ userId: 'u1', conectado: true, tieneEntregaEnCurso: false });
    vi.advanceTimersByTime(LOCATION_UPDATE_INTERVAL * 3);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('no comparte la ubicación si hay entrega pero está desconectado', () => {
    montar({ userId: 'u1', conectado: false, tieneEntregaEnCurso: true });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('envía al empezar y luego en cada intervalo mientras hay entrega en curso', () => {
    montar({ userId: 'u1', conectado: true, tieneEntregaEnCurso: true });
    expect(deliveryService.actualizarUbicacion).toHaveBeenCalledWith('u1', 6.1, -75.4);
    vi.advanceTimersByTime(LOCATION_UPDATE_INTERVAL);
    expect(deliveryService.actualizarUbicacion).toHaveBeenCalledTimes(2);
  });

  it('deja de enviar al terminar la entrega', () => {
    const { rerender } = montar({ userId: 'u1', conectado: true, tieneEntregaEnCurso: true });
    rerender({ userId: 'u1', conectado: true, tieneEntregaEnCurso: false });
    deliveryService.actualizarUbicacion.mockClear();
    vi.advanceTimersByTime(LOCATION_UPDATE_INTERVAL * 3);
    expect(deliveryService.actualizarUbicacion).not.toHaveBeenCalled();
  });

  it('deja de enviar al desmontar', () => {
    const { unmount } = montar({ userId: 'u1', conectado: true, tieneEntregaEnCurso: true });
    unmount();
    deliveryService.actualizarUbicacion.mockClear();
    vi.advanceTimersByTime(LOCATION_UPDATE_INTERVAL * 2);
    expect(deliveryService.actualizarUbicacion).not.toHaveBeenCalled();
  });
});
