import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../orderService';

const mockRpc = vi.fn();

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        rpc: (...a) => mockRpc(...a),
    },
}));

const baseOrder = {
    store_id: 's1',
    delivery_address: 'Calle 10 #20-30',
    payment_method: 'efectivo',
};
const items = [
    { product_id: 'p1', quantity: 2 },
    { product_id: 'p2', quantity: 1 },
];

describe('orderService.crearPedido', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRpc.mockResolvedValue({ data: { id: 'order-1', total: 31000 }, error: null });
    });

    it('delega el cálculo al servidor via create_order, sin mandar precios ni totales', async () => {
        await orderService.crearPedido(baseOrder, items);

        expect(mockRpc).toHaveBeenCalledWith('create_order', {
            p_store_id: 's1',
            p_items: [
                { product_id: 'p1', quantity: 2 },
                { product_id: 'p2', quantity: 1 },
            ],
            p_delivery_address: 'Calle 10 #20-30',
            p_payment_method: 'efectivo',
            p_notes: null,
            p_discount_code: null,
            p_shipping_rate_id: null,
            p_delivery_lat: null,
            p_delivery_lng: null,
        });
    });

    it('pasa el código de descuento y la tarifa de envío elegidos, si vienen', async () => {
        await orderService.crearPedido(
            { ...baseOrder, discount_code: 'VERANO20', shipping_rate_id: 'rate-1' },
            items
        );
        const call = mockRpc.mock.calls[0][1];
        expect(call.p_discount_code).toBe('VERANO20');
        expect(call.p_shipping_rate_id).toBe('rate-1');
    });

    it('no envía quantity/price que el cliente pudiera manipular más allá de product_id y quantity', async () => {
        await orderService.crearPedido(baseOrder, [{ product_id: 'p1', quantity: 2, price: 1 }]);
        const call = mockRpc.mock.calls[0][1];
        expect(call.p_items).toEqual([{ product_id: 'p1', quantity: 2 }]);
    });

    it('devuelve el pedido ya calculado por el servidor', async () => {
        const pedido = await orderService.crearPedido(baseOrder, items);
        expect(pedido).toEqual({ id: 'order-1', total: 31000 });
    });

    it('propaga el error del servidor (p.ej. stock insuficiente, cupón inválido)', async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'No hay stock suficiente de "X".' } });
        await expect(orderService.crearPedido(baseOrder, items)).rejects.toThrow();
    });

    it('valida datos obligatorios sin llamar al servidor', async () => {
        await expect(orderService.crearPedido({ ...baseOrder, store_id: null }, items)).rejects.toThrow();
        await expect(orderService.crearPedido(baseOrder, [])).rejects.toThrow();
        await expect(orderService.crearPedido({ ...baseOrder, delivery_address: '' }, items)).rejects.toThrow();
        expect(mockRpc).not.toHaveBeenCalled();
    });
});
