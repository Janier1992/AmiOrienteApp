import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../chatService';

const sim = vi.hoisted(() => ({ actual: null }));
vi.mock('@/lib/customSupabaseClient', async () => {
  const { crearSupabaseSimulado: crear } = await import('./helpers/supabaseSimulado');
  sim.actual = crear();
  return { supabase: sim.actual.supabase };
});

const db = () => sim.actual;
const PEDIDO = 'pedido-1';

beforeEach(() => {
  db().reiniciar();
  db().supabase.rpc.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('chatService', () => {
  it('rechaza un pedido vacío sin consultar', async () => {
    await expect(chatService.obtenerMensajes('')).rejects.toThrow(/pedido es requerido/);
    await expect(chatService.enviarMensaje(null, 'x')).rejects.toThrow(/pedido es requerido/);
    expect(db().consultas).toHaveLength(0);
    expect(db().supabase.rpc).not.toHaveBeenCalled();
  });

  it('obtenerMensajes pide los del pedido, del más antiguo al más nuevo', async () => {
    db().responder('order_messages', { data: [{ id: 'm1' }], error: null });
    expect(await chatService.obtenerMensajes(PEDIDO)).toEqual([{ id: 'm1' }]);
    expect(db().paso('order_messages', 'eq')).toEqual(['order_id', PEDIDO]);
    expect(db().paso('order_messages', 'order')).toEqual(['created_at', { ascending: true }]);
  });

  it('obtenerMensajes falla con el mensaje del servidor', async () => {
    db().responder('order_messages', { data: null, error: { message: 'sin permiso' } });
    await expect(chatService.obtenerMensajes(PEDIDO)).rejects.toThrow('sin permiso');
  });

  it('enviarMensaje usa send_order_message y devuelve el registro', async () => {
    db().supabase.rpc.mockResolvedValue({ data: { id: 'm1', body: 'Hola' }, error: null });
    expect(await chatService.enviarMensaje(PEDIDO, 'Hola')).toEqual({ id: 'm1', body: 'Hola' });
    expect(db().supabase.rpc).toHaveBeenCalledWith('send_order_message', { p_order_id: PEDIDO, p_body: 'Hola' });
  });

  it('enviarMensaje propaga el motivo del servidor (p. ej. el pedido ya terminó)', async () => {
    db().supabase.rpc.mockResolvedValue({ data: null, error: { message: 'El chat solo está disponible mientras el pedido va en camino.' } });
    await expect(chatService.enviarMensaje(PEDIDO, 'Hola')).rejects.toThrow(/va en camino/);
  });

  it('marcarLeidos y reportarConversacion llaman a sus funciones del servidor', async () => {
    db().supabase.rpc.mockResolvedValue({ data: 'rep-1', error: null });
    await chatService.marcarLeidos(PEDIDO);
    expect(db().supabase.rpc).toHaveBeenCalledWith('mark_order_messages_read', { p_order_id: PEDIDO });
    expect(await chatService.reportarConversacion(PEDIDO, 'Me trató mal')).toBe('rep-1');
    expect(db().supabase.rpc).toHaveBeenCalledWith('report_order_chat', { p_order_id: PEDIDO, p_reason: 'Me trató mal' });
  });

  it('suscribirse filtra por pedido, entrega los mensajes nuevos y se puede cancelar', () => {
    let manejador;
    const canal = { on: vi.fn((_t, filtro, fn) => { manejador = { filtro, fn }; return canal; }), subscribe: vi.fn(() => canal) };
    db().supabase.channel = vi.fn(() => canal);
    db().supabase.removeChannel = vi.fn();
    const recibidos = [];
    const cancelar = chatService.suscribirse(PEDIDO, (m) => recibidos.push(m));
    expect(manejador.filtro).toMatchObject({ event: 'INSERT', table: 'order_messages', filter: `order_id=eq.${PEDIDO}` });
    manejador.fn({ new: { id: 'm9' } });
    expect(recibidos).toEqual([{ id: 'm9' }]);
    cancelar();
    expect(db().supabase.removeChannel).toHaveBeenCalledWith(canal);
  });
});
