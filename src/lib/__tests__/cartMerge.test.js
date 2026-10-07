import { describe, it, expect } from 'vitest';
import { mergeCartItems, readStoredCartItems } from '../cartMerge';

describe('mergeCartItems', () => {
  it('conserva los items del invitado cuando el usuario no tenía carrito', () => {
    const guest = [{ id: 'a', quantity: 2, price: 10 }];
    expect(mergeCartItems([], guest)).toEqual(guest);
  });
  it('suma cantidades de productos repetidos', () => {
    const result = mergeCartItems([{ id: 'a', quantity: 1 }], [{ id: 'a', quantity: 3 }, { id: 'b', quantity: 1 }]);
    expect(result).toEqual([{ id: 'a', quantity: 4 }, { id: 'b', quantity: 1 }]);
  });
  it('ignora entradas inválidas y normaliza cantidades', () => {
    const result = mergeCartItems([null, { id: 'a', quantity: 0 }], [{ quantity: 5 }]);
    expect(result).toEqual([{ id: 'a', quantity: 1 }]);
  });
  it('devuelve vacío sin datos', () => {
    expect(mergeCartItems()).toEqual([]);
  });
});

describe('readStoredCartItems', () => {
  const storage = (v) => ({ getItem: () => v });
  it('lee items válidos', () => {
    expect(readStoredCartItems(storage('{"items":[{"id":"a","quantity":1}]}'), 'k')).toHaveLength(1);
  });
  it('tolera JSON corrupto o vacío', () => {
    expect(readStoredCartItems(storage('{no json'), 'k')).toEqual([]);
    expect(readStoredCartItems(storage(null), 'k')).toEqual([]);
    expect(readStoredCartItems(storage('{"items":5}'), 'k')).toEqual([]);
  });
});
