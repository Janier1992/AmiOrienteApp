/**
 * =============================================================================
 * TESTS PARA cartStore.js
 * =============================================================================
 * 
 * Descripción:
 *   Tests unitarios para el store del carrito de compras.
 *   Verifica el correcto funcionamiento de operaciones CRUD del carrito.
 *   No requiere conexión a base de datos (lógica pura).
 * 
 * Ejecución:
 *   npm run test
 * 
 * Autor: Equipo MiOriente
 * =============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCartStore } from '../cartStore';

// =============================================================================
// SETUP
// =============================================================================

// Productos de prueba
const productoHamburguesa = {
    id: 'prod-1',
    name: 'Hamburguesa Especial',
    price: 15000,
    store_id: 'store-1',
    image_url: 'https://example.com/hamburguesa.jpg'
};

const productoRefresco = {
    id: 'prod-2',
    name: 'Refresco',
    price: 3000,
    store_id: 'store-1'
};

const productoPizza = {
    id: 'prod-3',
    name: 'Pizza',
    price: 25000,
    store_id: 'store-2' // Tienda diferente
};

let useCart;

// Crear un nuevo store antes de cada test
beforeEach(() => {
    useCart = createCartStore();
});

// =============================================================================
// TESTS DE INICIALIZACIÓN
// =============================================================================

describe('Inicialización del carrito', () => {
    it('debería empezar con un carrito vacío', () => {
        const state = useCart.getState();
        expect(state.items).toEqual([]);
        expect(state.isInitialized).toBe(false);
    });

    it('debería inicializar con items existentes', () => {
        const itemsGuardados = [{ ...productoHamburguesa, quantity: 2 }];
        useCart.getState().initialize(itemsGuardados);

        const state = useCart.getState();
        expect(state.items).toHaveLength(1);
        expect(state.isInitialized).toBe(true);
        expect(state.items[0].quantity).toBe(2);
    });

    it('debería manejar initialize con valor inválido', () => {
        useCart.getState().initialize(null);

        const state = useCart.getState();
        expect(state.items).toEqual([]);
        expect(state.isInitialized).toBe(true);
    });
});

// =============================================================================
// TESTS DE AGREGAR AL CARRITO
// =============================================================================

describe('addToCart() - Agregar productos', () => {
    it('debería agregar un nuevo producto', () => {
        useCart.getState().addToCart(productoHamburguesa);

        const state = useCart.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].id).toBe('prod-1');
        expect(state.items[0].quantity).toBe(1);
    });

    it('debería agregar con cantidad específica', () => {
        useCart.getState().addToCart(productoHamburguesa, 3);

        const state = useCart.getState();
        expect(state.items[0].quantity).toBe(3);
    });

    it('debería incrementar cantidad si producto ya existe', () => {
        useCart.getState().addToCart(productoHamburguesa, 2);
        useCart.getState().addToCart(productoHamburguesa, 3);

        const state = useCart.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(5);
    });

    it('debería agregar múltiples productos diferentes', () => {
        useCart.getState().addToCart(productoHamburguesa);
        useCart.getState().addToCart(productoRefresco);

        const state = useCart.getState();
        expect(state.items).toHaveLength(2);
    });

    it('debería ignorar productos inválidos', () => {
        useCart.getState().addToCart(null);
        useCart.getState().addToCart({});

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });

    it('debería ignorar cantidades inválidas', () => {
        useCart.getState().addToCart(productoHamburguesa, 0);
        useCart.getState().addToCart(productoRefresco, -1);

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });
});

// =============================================================================
// TESTS DE ELIMINAR DEL CARRITO
// =============================================================================

describe('removeFromCart() - Eliminar productos', () => {
    beforeEach(() => {
        useCart.getState().addToCart(productoHamburguesa, 2);
        useCart.getState().addToCart(productoRefresco, 1);
    });

    it('debería eliminar un producto específico', () => {
        useCart.getState().removeFromCart('prod-1');

        const state = useCart.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].id).toBe('prod-2');
    });

    it('debería manejar IDs inexistentes sin errores', () => {
        useCart.getState().removeFromCart('producto-inexistente');

        const state = useCart.getState();
        expect(state.items).toHaveLength(2);
    });

    it('debería manejar ID vacío', () => {
        useCart.getState().removeFromCart('');
        useCart.getState().removeFromCart(null);

        const state = useCart.getState();
        expect(state.items).toHaveLength(2);
    });
});

// =============================================================================
// TESTS DE ACTUALIZAR CANTIDAD
// =============================================================================

describe('updateQuantity() - Actualizar cantidades', () => {
    beforeEach(() => {
        useCart.getState().addToCart(productoHamburguesa, 2);
    });

    it('debería actualizar cantidad de un producto', () => {
        useCart.getState().updateQuantity('prod-1', 5);

        const state = useCart.getState();
        expect(state.items[0].quantity).toBe(5);
    });

    it('debería eliminar producto si cantidad es 0', () => {
        useCart.getState().updateQuantity('prod-1', 0);

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });

    it('debería eliminar producto si cantidad es negativa', () => {
        useCart.getState().updateQuantity('prod-1', -1);

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });
});

// =============================================================================
// TESTS DE VACIAR CARRITO
// =============================================================================

describe('clearCart() - Vaciar carrito', () => {
    it('debería vaciar todos los productos', () => {
        useCart.getState().addToCart(productoHamburguesa, 2);
        useCart.getState().addToCart(productoRefresco, 1);

        useCart.getState().clearCart();

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });

    it('debería funcionar en carrito vacío', () => {
        useCart.getState().clearCart();

        const state = useCart.getState();
        expect(state.items).toHaveLength(0);
    });
});

// =============================================================================
// TESTS DE CÁLCULOS
// =============================================================================

describe('getCartTotal() - Total del carrito', () => {
    it('debería calcular total correctamente', () => {
        useCart.getState().addToCart(productoHamburguesa, 2); // 30,000
        useCart.getState().addToCart(productoRefresco, 3);    // 9,000

        const total = useCart.getState().getCartTotal();
        expect(total).toBe(39000);
    });

    it('debería retornar 0 para carrito vacío', () => {
        const total = useCart.getState().getCartTotal();
        expect(total).toBe(0);
    });
});

describe('getCartItemCount() - Conteo de items', () => {
    it('debería contar items totales', () => {
        useCart.getState().addToCart(productoHamburguesa, 2);
        useCart.getState().addToCart(productoRefresco, 3);

        const count = useCart.getState().getCartItemCount();
        expect(count).toBe(5);
    });

    it('debería retornar 0 para carrito vacío', () => {
        const count = useCart.getState().getCartItemCount();
        expect(count).toBe(0);
    });
});

describe('getProductQuantity() - Cantidad de producto específico', () => {
    beforeEach(() => {
        useCart.getState().addToCart(productoHamburguesa, 3);
    });

    it('debería retornar cantidad de un producto', () => {
        const qty = useCart.getState().getProductQuantity('prod-1');
        expect(qty).toBe(3);
    });

    it('debería retornar 0 para producto no existe', () => {
        const qty = useCart.getState().getProductQuantity('prod-inexistente');
        expect(qty).toBe(0);
    });
});

// =============================================================================
// TESTS DE UTILIDADES
// =============================================================================

describe('isEmpty() - Verificar si está vacío', () => {
    it('debería retornar true para carrito vacío', () => {
        expect(useCart.getState().isEmpty()).toBe(true);
    });

    it('debería retornar false para carrito con items', () => {
        useCart.getState().addToCart(productoHamburguesa);
        expect(useCart.getState().isEmpty()).toBe(false);
    });
});

describe('isSingleStore() - Una sola tienda', () => {
    it('debería retornar true para carrito vacío', () => {
        expect(useCart.getState().isSingleStore()).toBe(true);
    });

    it('debería retornar true para productos de una tienda', () => {
        useCart.getState().addToCart(productoHamburguesa);
        useCart.getState().addToCart(productoRefresco);

        expect(useCart.getState().isSingleStore()).toBe(true);
    });

    it('debería retornar false para productos de múltiples tiendas', () => {
        useCart.getState().addToCart(productoHamburguesa); // store-1
        useCart.getState().addToCart(productoPizza);        // store-2

        expect(useCart.getState().isSingleStore()).toBe(false);
    });
});

describe('getStoreId() - ID de la tienda', () => {
    it('debería retornar null para carrito vacío', () => {
        expect(useCart.getState().getStoreId()).toBeNull();
    });

    it('debería retornar ID de la tienda', () => {
        useCart.getState().addToCart(productoHamburguesa);
        expect(useCart.getState().getStoreId()).toBe('store-1');
    });
});

describe('reset() - Resetear estado', () => {
    it('debería resetear todo el estado', () => {
        useCart.getState().initialize([{ ...productoHamburguesa, quantity: 1 }]);
        useCart.getState().reset();

        const state = useCart.getState();
        expect(state.items).toEqual([]);
        expect(state.isInitialized).toBe(false);
    });
});
