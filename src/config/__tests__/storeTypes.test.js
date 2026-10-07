import { describe, it, expect, vi } from 'vitest';

import { STORE_TYPES, getStoreTypeConfig } from '../storeTypes';

// Los stores importan el cliente de Supabase, que exige variables de entorno.
vi.mock('@/lib/customSupabaseClient', () => ({ supabase: {}, customSupabaseClient: {}, default: {} }));

describe('verticales con Punto de Venta', () => {
  const posTypes = Object.entries(STORE_TYPES).filter(([, cfg]) => cfg.features.includes('pos'));

  it('hay verticales con POS', () => {
    expect(posTypes.length).toBeGreaterThan(0);
  });

  it.each(posTypes)('%s declara un cartStore compatible con GenericPOSView', (key, cfg) => {
    expect(cfg.cartStore, `${key} no define cartStore`).toBeTypeOf('function');
    const state = cfg.cartStore.getState();
    // GenericPOSView usa estos campos del store de cada vertical
    expect(Array.isArray(state.products)).toBe(true);
    expect(Array.isArray(state.cart)).toBe(true);
    for (const fn of ['fetchProducts', 'addToCart', 'removeFromCart', 'updateCartQty', 'clearCart', 'processCheckout']) {
      expect(state[fn], `${key}.${fn}`).toBeTypeOf('function');
    }
  });
});

describe('getStoreTypeConfig', () => {
  it('resuelve los nombres de categoría de la base de datos', () => {
    expect(getStoreTypeConfig('Papelería / Miscelánea').label).toBe('Papelería');
    expect(getStoreTypeConfig('Cultivadores').label).toBe(STORE_TYPES.cultivos.label);
    expect(getStoreTypeConfig('Hotel').label).toBe(STORE_TYPES.hotel.label);
  });
  it('usa comercio general como respaldo', () => {
    expect(getStoreTypeConfig(undefined)).toBe(STORE_TYPES.general);
    expect(getStoreTypeConfig('algo desconocido')).toBe(STORE_TYPES.general);
  });
});
