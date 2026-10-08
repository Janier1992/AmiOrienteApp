import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deliveryService } from '../deliveryService';

let rpcError = null;
const mockRpc = vi.fn();

vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        rpc: (...a) => mockRpc(...a),
        from: (table) => {
            if (table !== 'deliveries') throw new Error(`Tabla inesperada: ${table}`);
            return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'd1' } }) }) }) };
        },
    },
}));

beforeEach(() => {
    rpcError = null;
    vi.clearAllMocks();
    mockRpc.mockImplementation((fn) =>
        Promise.resolve(rpcError ? { data: null, error: rpcError } : { data: fn === 'update_delivery_status' ? { id: 'd1', status: 'Entregado' } : null, error: null })
    );
});

describe('deliveryService.aceptarEntrega', () => {
    it('acepta mediante la función accept_order del servidor', async () => {
        const result = await deliveryService.aceptarEntrega('order-1', 'driver-1');
        expect(mockRpc).toHaveBeenCalledWith('accept_order', {
            order_id_to_accept: 'order-1',
            delivery_person_id_to_assign: 'driver-1',
        });
        expect(result).toEqual({ id: 'd1' });
    });

    it('si otro domiciliario lo tomó (23505) muestra el mensaje claro', async () => {
        rpcError = { code: '23505', message: 'duplicate' };
        await expect(deliveryService.aceptarEntrega('order-1', 'driver-2')).rejects.toThrow('ya fue tomado');
    });

    it('propaga el error del servidor (pedido no disponible)', async () => {
        rpcError = { code: 'P0001', message: 'Este pedido ya no está disponible.' };
        await expect(deliveryService.aceptarEntrega('order-1', 'driver-1')).rejects.toThrow();
    });

    it('valida ids obligatorios', async () => {
        await expect(deliveryService.aceptarEntrega('', 'driver-1')).rejects.toThrow();
        await expect(deliveryService.aceptarEntrega('order-1', '')).rejects.toThrow();
        expect(mockRpc).not.toHaveBeenCalled();
    });
});

describe('deliveryService.actualizarEstadoEntrega', () => {
    it('cambia el estado mediante update_delivery_status', async () => {
        const result = await deliveryService.actualizarEstadoEntrega('order-1', 'Entregado');
        expect(mockRpc).toHaveBeenCalledWith('update_delivery_status', { p_order_id: 'order-1', p_status: 'Entregado' });
        expect(result.status).toBe('Entregado');
    });

    it('rechaza estados inválidos sin llamar al servidor', async () => {
        await expect(deliveryService.actualizarEstadoEntrega('order-1', 'Volando')).rejects.toThrow('Estado inválido');
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('propaga el error si la entrega no es del domiciliario', async () => {
        rpcError = { code: '42501', message: 'Esta entrega no es tuya.' };
        await expect(deliveryService.actualizarEstadoEntrega('order-1', 'Recogido')).rejects.toThrow();
    });
});
