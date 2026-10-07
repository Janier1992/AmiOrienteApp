import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deliveryService } from '../deliveryService';

let existingDelivery = null;
let insertError = null;
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        from: (table) => {
            if (table === 'deliveries') {
                return {
                    select: () => ({
                        eq: () => ({ not: () => ({ maybeSingle: () => Promise.resolve({ data: existingDelivery }) }) }),
                    }),
                    insert: () => ({
                        select: () => ({
                            single: () => Promise.resolve(
                                insertError ? { data: null, error: insertError } : { data: { id: 'd1' }, error: null }
                            ),
                        }),
                    }),
                };
            }
            if (table === 'orders') return { update: () => ({ eq: (...a) => mockUpdateEq(...a) }) };
            throw new Error(`Tabla inesperada: ${table}`);
        },
    },
}));

describe('deliveryService.aceptarEntrega', () => {
    beforeEach(() => {
        existingDelivery = null;
        insertError = null;
        vi.clearAllMocks();
    });

    it('asigna la entrega y pone el pedido "En curso"', async () => {
        const result = await deliveryService.aceptarEntrega('order-1', 'driver-1');
        expect(result).toEqual({ id: 'd1' });
        expect(mockUpdateEq).toHaveBeenCalledWith('id', 'order-1');
    });

    it('rechaza si el pedido ya fue tomado (verificación previa)', async () => {
        existingDelivery = { id: 'otra' };
        await expect(deliveryService.aceptarEntrega('order-1', 'driver-1'))
            .rejects.toThrow('ya fue tomado');
    });

    it('si dos domiciliarios aceptan a la vez, el índice único (23505) da el mismo mensaje', async () => {
        insertError = { code: '23505', message: 'duplicate key value violates unique constraint' };
        await expect(deliveryService.aceptarEntrega('order-1', 'driver-2'))
            .rejects.toThrow('ya fue tomado');
        expect(mockUpdateEq).not.toHaveBeenCalled();
    });

    it('valida ids obligatorios', async () => {
        await expect(deliveryService.aceptarEntrega('', 'driver-1')).rejects.toThrow();
        await expect(deliveryService.aceptarEntrega('order-1', '')).rejects.toThrow();
    });
});
