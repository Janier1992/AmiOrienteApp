import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeService } from '../storeService';

const sim = vi.hoisted(() => ({ actual: null }));
vi.mock('@/lib/customSupabaseClient', async () => {
  const { crearSupabaseSimulado: crear } = await import('./helpers/supabaseSimulado');
  sim.actual = crear();
  return { supabase: sim.actual.supabase };
});

const db = () => sim.actual;
const ID = 'store-1';

beforeEach(() => {
  db().reiniciar();
  db().supabase.rpc.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('storeService · validación de entradas', () => {
  it.each([
    ['obtenerProductos', ['']],
    ['obtenerPedidos', [null]],
    ['obtenerEstadisticasTienda', [undefined]],
    ['actualizarEstadoPedido', ['', 'Confirmado']],
  ])('%s rechaza un identificador vacío sin consultar la base', async (metodo, args) => {
    await expect(storeService[metodo](...args)).rejects.toThrow(/requerido/);
    expect(db().consultas).toHaveLength(0);
  });

  it('actualizarEstadoPedido exige un estado', async () => {
    await expect(storeService.actualizarEstadoPedido('o1', '')).rejects.toThrow(/estado del pedido es requerido/);
  });
});

describe('storeService · productos y variantes (ropa)', () => {
  it('obtenerProductos pide los de la tienda, del más nuevo al más viejo, y separa las variantes de la descripción', async () => {
    const variantes = [{ size: 'M', color: 'Rojo', qty: 3 }];
    db().responder('products', {
      data: [{ id: 'p1', description: `Camisa\n\nVARIANTS_JSON: ${JSON.stringify(variantes)}` }, { id: 'p2', description: 'Sin variantes' }],
      error: null,
    });
    const productos = await storeService.obtenerProductos(ID);
    expect(db().paso('products', 'eq')).toEqual(['store_id', ID]);
    expect(db().paso('products', 'order')).toEqual(['created_at', { ascending: false }]);
    expect(productos[0]).toMatchObject({ id: 'p1', description: 'Camisa', variants: variantes });
    expect(productos[1]).toMatchObject({ id: 'p2', description: 'Sin variantes', variants: [] });
  });

  it('crearProducto exige la tienda', async () => {
    await expect(storeService.crearProducto({ name: 'x' })).rejects.toThrow(/datos del producto son requeridos/);
  });

  it('crearProducto con variantes las guarda dentro de la descripción y suma el inventario', async () => {
    db().responder('products', { data: { id: 'p9', description: 'x' }, error: null });
    await storeService.crearProducto({
      store_id: ID, name: 'Camisa', price: 50000, stock: 0, description: 'Algodón',
      variants: [{ size: 'S', qty: 2 }, { size: 'M', qty: '3' }],
    });
    const [carga] = db().paso('products', 'insert');
    expect(carga.stock).toBe(5);
    expect(carga.description).toMatch(/^Algodón\n\nVARIANTS_JSON: \[/);
    expect(carga).not.toHaveProperty('variants');
  });

  it('crearProducto sin variantes conserva inventario y descripción tal cual', async () => {
    db().responder('products', { data: { id: 'p9', description: 'Arroz' }, error: null });
    await storeService.crearProducto({ store_id: ID, name: 'Arroz', stock: 40, description: 'Arroz' });
    const [carga] = db().paso('products', 'insert');
    expect(carga).toMatchObject({ stock: 40, description: 'Arroz' });
  });

  it('actualizarProducto con variantes también las codifica y devuelve el producto con ellas separadas', async () => {
    const variantes = [{ size: 'L', qty: 4 }];
    db().responder('products', {
      data: { id: 'p1', description: `Camisa\n\nVARIANTS_JSON: ${JSON.stringify(variantes)}` }, error: null,
    });
    const producto = await storeService.actualizarProducto('p1', { name: 'Camisa', description: 'Camisa', variants: variantes });
    const [carga] = db().paso('products', 'update');
    expect(carga).toMatchObject({ name: 'Camisa', stock: 4 });
    expect(carga.description).toContain('VARIANTS_JSON');
    expect(carga).not.toHaveProperty('variants');
    expect(producto).toMatchObject({ description: 'Camisa', variants: variantes });
  });

  it('actualizarProducto sin variantes no toca descripción ni inventario', async () => {
    db().responder('products', { data: { id: 'p1' }, error: null });
    await storeService.actualizarProducto('p1', { price: 10 });
    expect(db().paso('products', 'update')[0]).toEqual({ price: 10 });
  });

  it('traduce los errores conocidos de PostgreSQL a mensajes en español', async () => {
    db().responder('products', { data: null, error: { code: '23505', message: 'duplicate key value' } });
    await expect(storeService.crearProducto({ store_id: ID, name: 'x' })).rejects.toThrow('Ya existe un registro con esos datos');
    db().responder('products', { data: null, error: { code: '23503', message: 'fk' } });
    await expect(storeService.crearProducto({ store_id: ID, name: 'x' })).rejects.toThrow('Referencia a un registro que no existe');
  });

  it('eliminarProducto borra por id y propaga el error del servidor', async () => {
    await storeService.eliminarProducto('p1');
    expect(db().paso('products', 'delete')).toEqual([]);
    expect(db().paso('products', 'eq')).toEqual(['id', 'p1']);

    db().responder('products', { error: { message: 'violates RLS' } });
    await expect(storeService.eliminarProducto('p1')).rejects.toThrow('violates RLS');
  });
});

describe('storeService · pedidos', () => {
  it('actualizarEstadoPedido cambia solo el estado del pedido indicado', async () => {
    db().responder('orders', { data: { id: 'o1', status: 'Confirmado' }, error: null });
    const r = await storeService.actualizarEstadoPedido('o1', 'Confirmado');
    expect(db().paso('orders', 'update')).toEqual([{ status: 'Confirmado' }]);
    expect(db().paso('orders', 'eq')).toEqual(['id', 'o1']);
    expect(r.status).toBe('Confirmado');
  });

  it('obtenerPedidos devuelve lista vacía cuando no hay pedidos', async () => {
    db().responder('orders', { data: null, error: null });
    expect(await storeService.obtenerPedidos(ID)).toEqual([]);
  });

  it('obtenerPedidos lanza un mensaje claro si falla la consulta', async () => {
    db().responder('orders', { data: null, error: { message: 'timeout' } });
    await expect(storeService.obtenerPedidos(ID)).rejects.toThrow('timeout');
  });
});

describe('storeService · tienda, clientes y estadísticas', () => {
  it('obtenerTiendaDelUsuario devuelve la propia con rol «owner»', async () => {
    db().responder('stores', { data: { id: ID, name: 'Mi tienda' }, error: null });
    expect(await storeService.obtenerTiendaDelUsuario('u1')).toMatchObject({ id: ID, viewerRole: 'owner' });
  });

  it('obtenerTiendaDelUsuario cae a la membresía de equipo con su rol', async () => {
    db().responder('stores', { data: null, error: null });
    db().responder('store_members', { data: { role: 'editor', stores: { id: 'otra', name: 'Otra' } }, error: null });
    expect(await storeService.obtenerTiendaDelUsuario('u1')).toMatchObject({ id: 'otra', viewerRole: 'editor' });
  });

  it('obtenerTiendaDelUsuario devuelve null si no tiene tienda ni equipo', async () => {
    db().responder('stores', { data: null, error: null });
    db().responder('store_members', { data: null, error: null });
    expect(await storeService.obtenerTiendaDelUsuario('u1')).toBeNull();
  });

  it('obtenerClientesTienda agrupa por cliente: gasto total, número de pedidos y último pedido', async () => {
    const ana = { id: 'c1', full_name: 'Ana' };
    db().responder('orders', {
      data: [
        { customer_id: 'c1', profiles: ana, created_at: '2026-10-03', total: '10000' },
        { customer_id: 'c1', profiles: ana, created_at: '2026-10-01', total: 5000 },
        { customer_id: null, profiles: null, created_at: '2026-10-02', total: 999 }, // venta de mostrador: se ignora
      ],
      error: null,
    });
    const [cliente, ...resto] = await storeService.obtenerClientesTienda(ID);
    expect(resto).toHaveLength(0);
    expect(cliente).toMatchObject({ full_name: 'Ana', total_spent: 15000, total_orders: 2, last_order: '2026-10-03' });
  });

  it('obtenerClientesTienda devuelve lista vacía (y no rompe la pantalla) si falla', async () => {
    db().responder('orders', { data: null, error: { message: 'x' } });
    expect(await storeService.obtenerClientesTienda(ID)).toEqual([]);
  });

  it('obtenerEstadisticasTienda usa la primera fila de get_store_stats y {} si no hay', async () => {
    db().supabase.rpc.mockResolvedValueOnce({ data: [{ total_orders: 7 }], error: null });
    expect(await storeService.obtenerEstadisticasTienda(ID)).toEqual({ total_orders: 7 });
    expect(db().supabase.rpc).toHaveBeenCalledWith('get_store_stats', { p_store_id: ID });
    db().supabase.rpc.mockResolvedValueOnce({ data: [], error: null });
    expect(await storeService.obtenerEstadisticasTienda(ID)).toEqual({});
  });

  it('obtenerIngresosMensuales suma por mes solo los pedidos entregados', async () => {
    db().responder('orders', {
      data: [
        { created_at: '2026-10-05T12:00:00', total: 1000 },
        { created_at: '2026-10-20T12:00:00', total: '2500' },
        { created_at: '2026-09-10T12:00:00', total: 400 },
      ],
      error: null,
    });
    const mes = (iso) => new Date(iso).toLocaleString('es-CO', { month: 'short' });
    const r = await storeService.obtenerIngresosMensuales(ID);
    expect(db().paso('orders', 'eq')).toEqual(['store_id', ID]);
    expect(r).toEqual([{ mes: mes('2026-10-05T12:00:00'), total: 3500 }, { mes: mes('2026-09-10T12:00:00'), total: 400 }]
      .sort((a, b) => r.findIndex((x) => x.mes === a.mes) - r.findIndex((x) => x.mes === b.mes)));
  });
});

describe('storeService · operación (mesas y equipos)', () => {
  it('getEquipment devuelve [] si falla (para no romper la pantalla) y addEquipment propaga el error', async () => {
    db().responder('store_equipment', { data: null, error: { message: 'x' } });
    expect(await storeService.getEquipment(ID)).toEqual([]);
    await expect(storeService.addEquipment({ name: 'Horno' })).rejects.toMatchObject({ message: 'x' });
  });

  it('updateTableStatus cambia el estado de la mesa', async () => {
    await storeService.updateTableStatus('t1', 'ocupada');
    expect(db().paso('restaurant_tables', 'update')).toEqual([{ status: 'ocupada' }]);
    expect(db().paso('restaurant_tables', 'eq')).toEqual(['id', 't1']);
  });
});
