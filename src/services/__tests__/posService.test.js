import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posService } from '../posService';

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsertOrders = vi.fn(() => ({ select: mockSelect }));
const mockInsertItems = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));

const mockFrom = vi.fn((table) => {
    if (table === 'orders') return { insert: mockInsertOrders };
    if (table === 'order_items') return { insert: mockInsertItems };
    if (table === 'products') return { update: mockUpdate };
    throw new Error(`Unexpected table: ${table}`);
});

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: { from: (...args) => mockFrom(...args) },
}));

const cart = [
    { id: 'prod-1', name: 'Arroz', price: 5000, qty: 2, stock: 10 },
    { id: 'prod-2', name: 'Servicio', price: 20000, qty: 1 }, // no stock field (service/hotel-style item)
];

describe('posService.createPOSSale', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSingle.mockResolvedValue({ data: { id: 'order-1' }, error: null });
        mockInsertItems.mockResolvedValue({ error: null });
        mockEq.mockResolvedValue({ error: null });
    });

    it('crea la orden con los datos correctos', async () => {
        await posService.createPOSSale({
            storeId: 'store-1',
            cart,
            guestInfo: { name: 'Cliente Mostrador', method: 'efectivo', type: 'POS' },
            total: 30000,
            status: 'Entregado',
        });

        expect(mockFrom).toHaveBeenCalledWith('orders');
        const orderPayload = mockInsertOrders.mock.calls[0][0];
        expect(orderPayload.store_id).toBe('store-1');
        expect(orderPayload.customer_id).toBeNull();
        expect(orderPayload.status).toBe('Entregado');
        expect(orderPayload.total).toBe(30000);
        expect(JSON.parse(orderPayload.delivery_address).items).toHaveLength(2);
    });

    it('inserta un order_item por cada producto del carrito', async () => {
        await posService.createPOSSale({ storeId: 'store-1', cart, guestInfo: {}, total: 30000 });

        expect(mockFrom).toHaveBeenCalledWith('order_items');
        const items = mockInsertItems.mock.calls[0][0];
        expect(items).toEqual([
            { order_id: 'order-1', product_id: 'prod-1', quantity: 2, price: 5000 },
            { order_id: 'order-1', product_id: 'prod-2', quantity: 1, price: 20000 },
        ]);
    });

    it('descuenta stock solo para items que lo tienen', async () => {
        await posService.createPOSSale({ storeId: 'store-1', cart, guestInfo: {}, total: 30000 });

        // Solo prod-1 tiene stock definido (10 - 2 = 8)
        expect(mockFrom).toHaveBeenCalledWith('products');
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockUpdate).toHaveBeenCalledWith({ stock: 8 });
        expect(mockEq).toHaveBeenCalledWith('id', 'prod-1');
    });

    it('nunca deja el stock en negativo', async () => {
        const overSoldCart = [{ id: 'prod-1', name: 'Arroz', price: 5000, qty: 99, stock: 5 }];
        await posService.createPOSSale({ storeId: 'store-1', cart: overSoldCart, guestInfo: {}, total: 5000 });

        expect(mockUpdate).toHaveBeenCalledWith({ stock: 0 });
    });

    it('lanza error y no sigue si falla la creación de la orden', async () => {
        mockSingle.mockResolvedValue({ data: null, error: new Error('db down') });

        await expect(
            posService.createPOSSale({ storeId: 'store-1', cart, guestInfo: {}, total: 30000 })
        ).rejects.toThrow('db down');

        expect(mockInsertItems).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('lanza error y no descuenta stock si falla la inserción de order_items', async () => {
        mockInsertItems.mockResolvedValue({ error: new Error('items failed') });

        await expect(
            posService.createPOSSale({ storeId: 'store-1', cart, guestInfo: {}, total: 30000 })
        ).rejects.toThrow('items failed');

        expect(mockUpdate).not.toHaveBeenCalled();
    });
});
