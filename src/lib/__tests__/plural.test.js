import { describe, it, expect } from 'vitest';
import { pluralizar } from '../plural';

describe('pluralizar', () => {
  it.each([
    ['Plato', 'Platos'],
    ['Comanda', 'Comandas'],
    ['Pedido Mayorista', 'Pedidos Mayoristas'],
    ['Cosecha/Producto', 'Cosechas/Productos'],
    ['Cita/Venta', 'Citas/Ventas'],
    ['Habitación', 'Habitaciones'],
    ['Reserva', 'Reservas'],
    ['Medicamento', 'Medicamentos'],
    ['Artículo', 'Artículos'],
  ])('%s -> %s', (singular, plural) => {
    expect(pluralizar(singular)).toBe(plural);
  });

  it('tolera valores vacíos', () => {
    expect(pluralizar('')).toBe('');
    expect(pluralizar(undefined)).toBe('');
  });
});
