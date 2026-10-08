import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewOrderAlerts } from '../use-new-order-alerts';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  chime: vi.fn(),
  notify: vi.fn(),
  fetchOrders: vi.fn(),
  listeners: new Set(),
  state: { orders: [], fetchOrders: null },
}));

vi.mock('@/components/ui/use-toast', () => ({ toast: (...a) => mocks.toast(...a) }));
vi.mock('@/lib/customSupabaseClient', () => {
  const channel = { on: () => channel, subscribe: () => channel };
  return { supabase: { channel: () => channel, removeChannel: vi.fn() } };
});
vi.mock('@/lib/orderAlerts', () => ({
  getSoundPreference: () => true,
  setSoundPreference: vi.fn(),
  unlockAudio: vi.fn(),
  playNewOrderChime: (...a) => mocks.chime(...a),
  notificationPermission: () => 'granted',
  requestBrowserNotifications: vi.fn(),
  showBrowserNotification: (...a) => mocks.notify(...a),
}));
vi.mock('@/stores/useStoreDashboard', () => ({
  useStoreDashboard: (selector) => {
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => {
      mocks.listeners.add(force);
      return () => mocks.listeners.delete(force);
    }, []);
    return selector(mocks.state);
  },
}));

const setOrders = (orders) => {
  mocks.state = { ...mocks.state, orders };
  act(() => mocks.listeners.forEach((f) => f()));
};
// Al montar, el hook pide la lista al servidor; esa primera respuesta fija el punto de partida.
const mountAndLoad = (orders) => {
  const hook = renderHook(() => useNewOrderAlerts('s1'));
  setOrders(orders);
  return hook;
};
const o = (id, status) => ({ id: `${id}-xxxxxxxx`, status, total: 5000 });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listeners.clear();
  mocks.state = { orders: [o('a', 'Pendiente')], fetchOrders: mocks.fetchOrders };
});

describe('useNewOrderAlerts', () => {
  it('la primera carga no avisa de lo que ya existía, pero cuenta los pendientes', () => {
    const { result } = mountAndLoad([o('a', 'Pendiente')]);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(result.current.pendingCount).toBe(1);
  });

  it('avisa con mensaje, sonido y notificación cuando llega un pedido nuevo', () => {
    mountAndLoad([o('a', 'Pendiente')]);
    setOrders([o('a', 'Pendiente'), o('b', 'Pendiente')]);
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    expect(mocks.chime).toHaveBeenCalledTimes(1);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it('no repite el aviso si el pedido solo cambia de estado', () => {
    mountAndLoad([o('a', 'Pendiente')]);
    setOrders([o('a', 'Confirmado')]);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.chime).not.toHaveBeenCalled();
  });

  it('avisa (sin sonido) cuando se cancela un pedido', () => {
    mountAndLoad([o('a', 'Pendiente')]);
    setOrders([o('a', 'Cancelado')]);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pedido cancelado' }));
    expect(mocks.chime).not.toHaveBeenCalled();
  });
});
