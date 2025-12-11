/**
 * =============================================================================
 * TESTS UNITARIOS - storeService
 * =============================================================================
 * 
 * Tests básicos para verificar que las funciones del servicio de tienda
 * manejan correctamente las validaciones y errores.
 * 
 * NOTA: Estos tests usan mocks de Supabase para no depender de la base de datos.
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del cliente de Supabase
vi.mock('@/lib/customSupabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
        })),
        rpc: vi.fn().mockResolvedValue({ data: [{}], error: null })
    }
}));

describe('storeService', () => {
    // Importar después del mock
    let storeService;

    beforeEach(async () => {
        // Re-importar para que use los mocks
        const module = await import('@/services/storeService');
        storeService = module.storeService;
    });

    describe('createProduct', () => {
        it('debería lanzar error si falta store_id', async () => {
            // Arrange
            const productoIncompleto = { name: 'Test Product' };

            // Act & Assert
            await expect(storeService.createProduct(productoIncompleto))
                .rejects.toThrow('Campos requeridos: store_id, name');
        });

        it('debería lanzar error si falta name', async () => {
            // Arrange
            const productoSinNombre = { store_id: 'tienda-123' };

            // Act & Assert
            await expect(storeService.createProduct(productoSinNombre))
                .rejects.toThrow('Campos requeridos: store_id, name');
        });
    });

    describe('deleteProduct', () => {
        it('debería lanzar error si no se proporciona ID', async () => {
            // Act & Assert
            await expect(storeService.deleteProduct())
                .rejects.toThrow('Se requiere el ID del producto');
        });

        it('debería lanzar error si el ID es vacío', async () => {
            // Act & Assert
            await expect(storeService.deleteProduct(''))
                .rejects.toThrow('Se requiere el ID del producto');
        });
    });

    describe('updateProduct', () => {
        it('debería lanzar error si no se proporciona ID', async () => {
            // Act & Assert
            await expect(storeService.updateProduct(null, { price: 100 }))
                .rejects.toThrow('Se requiere el ID del producto');
        });
    });
});
