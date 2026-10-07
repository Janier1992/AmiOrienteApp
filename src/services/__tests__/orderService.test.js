import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../orderService';

const mockOrderSingle = vi.fn();
const mockInsertOrder = vi.fn(() => ({ select: () => ({ single: mockOrderSingle }) }));
const mockInsertItems = vi.fn();
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        from: (table) => {
            if (table === 'orders') return { insert: (...a) => mockInsertOrder(...a), delete: () => mockDelete() };
            if (table === 'order_items') return { insert: (...a) => mockInsertItems(...a) };
            throw new Error(`Tabla inesperada: ${table}`);
        },
    },
}));

const baseOrder = {
    customer_id: 'u1',
    store_id: 's1',
    delivery_address: 'Calle 10 #20-30',
    payment_method: 'efectivo',
};
const items = [
    { product_id: 'p1', quantity: 2, price: 10000 },
    { product_id: 'p2', quantity: 1, price: 5000 },
];

describe('orderService.crearPedido', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOrderSingle.mockResolvedValue({ data: { id: 'order-1' }, error: null });
        mockInsertItems.mockResolvedValue({ error: null });
        mockDeleteEq.mockResolvedValue({ error: null });
    });

    it('calcula subtotal y total (tarifa de servicio + envío base)', async () => {
        await orderService.crearPedido(baseOrder, items);
        const payload = mockInsertOrder.mock.calls[0][0];
        expect(payload.subtotal).toBe(25000);
        expect(payload.service_fee).toBe(2000);
        expect(payload.delivery_fee).toBe(4000);
        expect(payload.total).toBe(25000 + 2000 + 4000);
    });

    it('usa envío, impuestos y descuento enviados, y el total nunca es negativo', async () => {
        await orderService.crearPedido(
            { ...baseOrder, shipping_fee: 6000, tax_amount: 1000, discount_amount: 3000 },
            items
        );
        const payload = mockInsertOrder.mock.calls[0][0];
        expect(payload.total).toBe(25000 + 2000 + 6000 + 1000 - 3000);

        await orderService.crearPedido({ ...baseOrder, discount_amount: 999999 }, items);
        expect(mockInsertOrder.mock.calls[1][0].total).toBe(0);
    });

    it('envío gratis (0) se respeta y no se reemplaza por la tarifa base', async () => {
        await orderService.crearPedido({ ...baseOrder, shipping_fee: 0 }, items);
        expect(mockInsertOrder.mock.calls[0][0].delivery_fee).toBe(0);
    });

    it('el pago en efectivo entra como "Pendiente de pago en efectivo"', async () => {
        await orderService.crearPedido(baseOrder, items);
        expect(mockInsertOrder.mock.calls[0][0].status).toBe('Pendiente de pago en efectivo');
    });

    it('crea los items ligados al pedido', async () => {
        await orderService.crearPedido(baseOrder, items);
        expect(mockInsertItems).toHaveBeenCalledWith([
            { order_id: 'order-1', product_id: 'p1', quantity: 2, price: 10000 },
            { order_id: 'order-1', product_id: 'p2', quantity: 1, price: 5000 },
        ]);
    });

    it('si fallan los items, elimina el pedido y propaga el error', async () => {
        mockInsertItems.mockResolvedValue({ error: { message: 'violación de RLS' } });
        await expect(orderService.crearPedido(baseOrder, items)).rejects.toThrow();
        expect(mockDelete).toHaveBeenCalled();
        expect(mockDeleteEq).toHaveBeenCalledWith('id', 'order-1');
    });

    it('valida datos obligatorios', async () => {
        await expect(orderService.crearPedido({ ...baseOrder, customer_id: null }, items)).rejects.toThrow();
        await expect(orderService.crearPedido(baseOrder, [])).rejects.toThrow();
        await expect(orderService.crearPedido({ ...baseOrder, delivery_address: '' }, items)).rejects.toThrow();
        expect(mockInsertOrder).not.toHaveBeenCalled();
    });
});
