import { describe, it, expect } from 'vitest';
import { CUSTOMER_CANCELABLE_STATUSES, STORE_CANCELABLE_STATUSES, isActiveOrder, isNewOrder } from '../orderRules';

describe('orderRules', () => {
  it('el cliente no puede cancelar cuando ya se prepara o va en camino', () => {
    ['En preparación', 'Listo para recogida', 'En curso', 'Entregado', 'Cancelado'].forEach((s) => {
      expect(CUSTOMER_CANCELABLE_STATUSES).not.toContain(s);
    });
    expect(CUSTOMER_CANCELABLE_STATUSES).toContain('Confirmado');
  });
  it('el negocio puede cancelar hasta que se recoge, no después', () => {
    expect(STORE_CANCELABLE_STATUSES).toContain('En preparación');
    expect(STORE_CANCELABLE_STATUSES).toContain('Listo para recogida');
    expect(STORE_CANCELABLE_STATUSES).not.toContain('En curso');
  });
  it('un pedido confirmado o en preparación sigue activo (antes se ocultaba al cliente)', () => {
    ['Confirmado', 'En preparación', 'Listo para recogida', 'En curso', 'Pendiente'].forEach((status) => {
      expect(isActiveOrder({ status })).toBe(true);
    });
    expect(isActiveOrder({ status: 'Entregado' })).toBe(false);
    expect(isActiveOrder({ status: 'Cancelado' })).toBe(false);
  });
  it('solo los pedidos sin atender cuentan como nuevos', () => {
    expect(isNewOrder({ status: 'Pendiente' })).toBe(true);
    expect(isNewOrder({ status: 'Confirmado' })).toBe(false);
  });
});
