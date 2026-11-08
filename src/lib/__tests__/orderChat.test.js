import { describe, it, expect } from 'vitest';
import { agregarMensaje, chatEstaAbierto, contarNoLeidos, RESPUESTAS_RAPIDAS } from '../orderChat';

const msg = (id, extra = {}) => ({ id, created_at: `2026-11-08T10:00:0${id}Z`, sender_id: 'otro', read_at: null, ...extra });

describe('orderChat', () => {
  it('solo se escribe con el pedido en curso', () => {
    expect(chatEstaAbierto('En curso')).toBe(true);
    ['Entregado', 'Cancelado', 'Listo para recogida', undefined].forEach((estado) => expect(chatEstaAbierto(estado)).toBe(false));
  });

  it('agregarMensaje no duplica y mantiene el orden por fecha', () => {
    let lista = agregarMensaje([], msg(2));
    lista = agregarMensaje(lista, msg(1));
    lista = agregarMensaje(lista, msg(2));
    expect(lista.map((m) => m.id)).toEqual([1, 2]);
  });

  it('agregarMensaje ignora mensajes sin id', () => {
    expect(agregarMensaje([msg(1)], null)).toHaveLength(1);
    expect(agregarMensaje([msg(1)], { body: 'x' })).toHaveLength(1);
  });

  it('cuenta solo los no leídos de la otra parte', () => {
    const lista = [msg(1), msg(2, { read_at: 'x' }), msg(3, { sender_id: 'yo' })];
    expect(contarNoLeidos(lista, 'yo')).toBe(1);
  });

  it('ofrece respuestas rápidas para cada rol', () => {
    expect(RESPUESTAS_RAPIDAS.domiciliario).toContain('Ya llegué');
    expect(RESPUESTAS_RAPIDAS.cliente.length).toBeGreaterThan(0);
  });
});
