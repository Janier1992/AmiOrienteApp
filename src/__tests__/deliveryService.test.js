/**
 * =============================================================================
 * TESTS UNITARIOS - deliveryService
 * =============================================================================
 * 
 * Tests para verificar que el servicio de domicilios valida correctamente
 * las coordenadas GPS y otros parámetros.
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del cliente de Supabase
vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
    }
}));

describe('deliveryService', () => {
    let deliveryService;

    beforeEach(async () => {
        const module = await import('@/services/deliveryService');
        deliveryService = module.deliveryService;
    });

    describe('updateLocation', () => {
        it('debería lanzar error si falta userId', async () => {
            await expect(deliveryService.updateLocation(null, 6.2, -75.5))
                .rejects.toThrow('Se requiere el ID del domiciliario');
        });

        it('debería lanzar error si las coordenadas no son números', async () => {
            await expect(deliveryService.updateLocation('user-1', 'abc', -75.5))
                .rejects.toThrow('Las coordenadas deben ser números válidos');
        });

        it('debería lanzar error si latitud está fuera de rango', async () => {
            // Latitud válida: -90 a 90
            await expect(deliveryService.updateLocation('user-1', 95, -75.5))
                .rejects.toThrow('Coordenadas fuera de rango válido');
        });

        it('debería lanzar error si longitud está fuera de rango', async () => {
            // Longitud válida: -180 a 180
            await expect(deliveryService.updateLocation('user-1', 6.2, -190))
                .rejects.toThrow('Coordenadas fuera de rango válido');
        });

        it('debería ejecutarse correctamente con coordenadas válidas', async () => {
            // Coordenadas de Medellín
            await expect(deliveryService.updateLocation('user-1', 6.2442, -75.5812))
                .resolves.not.toThrow();
        });
    });
});
