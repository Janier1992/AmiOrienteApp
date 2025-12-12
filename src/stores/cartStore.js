/**
 * =============================================================================
 * STORE DEL CARRITO DE COMPRAS (cartStore.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo implementa el store de Zustand para el carrito de compras.
 *   Gestiona el estado del carrito incluyendo items, cantidades y totales.
 *   Diseñado como factory function para permitir múltiples instancias si es necesario.
 * 
 * Responsabilidades:
 *   - Agregar productos al carrito
 *   - Actualizar cantidades de productos
 *   - Eliminar productos del carrito
 *   - Calcular totales
 *   - Persistencia del carrito (vía contexto)
 * 
 * Uso:
 *   // El store se crea en CartContext y se usa a través de useCart hook
 *   import { useCart } from '@/hooks/useCart';
 *   const { items, addToCart, removeFromCart, getCartTotal } = useCart();
 * 
 * Estructura de un Item:
 *   {
 *     id: string,          // UUID del producto
 *     name: string,        // Nombre del producto
 *     price: number,       // Precio unitario
 *     quantity: number,    // Cantidad en el carrito
 *     image_url?: string,  // URL de la imagen (opcional)
 *     store_id: string     // ID de la tienda
 *   }
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { create } from 'zustand';

// =============================================================================
// ESTADO INICIAL
// =============================================================================

/**
 * Estado inicial del carrito.
 * Separado para facilitar el reset.
 */
const estadoInicialCarrito = {
  /** Array de items en el carrito */
  items: []
};

// =============================================================================
// FACTORY DEL STORE
// =============================================================================

/**
 * Crea una nueva instancia del store del carrito.
 * Se usa como factory para permitir múltiples instancias o testing.
 * 
 * @returns {Function} Store de Zustand del carrito
 * 
 * @example
 * // Crear un store (normalmente se hace en CartContext)
 * const useCartStore = createCartStore();
 * 
 * // Usar en componentes
 * const { items, addToCart } = useCartStore();
 */
const createCartStore = () => create((set, get) => ({
  // ---------------------------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------------------------

  /** Items actuales en el carrito */
  ...estadoInicialCarrito,

  /** Indica si el carrito ha sido inicializado con datos persistidos */
  isInitialized: false,

  // ---------------------------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------------------------

  /**
   * Inicializa el carrito con items guardados (de localStorage o DB).
   * Se llama una vez al cargar la aplicación.
   * 
   * @param {Array} itemsIniciales - Items a cargar en el carrito
   */
  initialize: (itemsIniciales) => {
    if (!Array.isArray(itemsIniciales)) {
      console.warn('[cartStore] initialize: se esperaba un array');
      set({ items: [], isInitialized: true });
      return;
    }
    set({ items: itemsIniciales, isInitialized: true });
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE ITEMS
  // ---------------------------------------------------------------------------

  /**
   * Agrega un producto al carrito.
   * Si el producto ya existe, incrementa su cantidad.
   * 
   * @param {Object} producto - Producto a agregar
   * @param {string} producto.id - ID único del producto
   * @param {string} producto.name - Nombre del producto
   * @param {number} producto.price - Precio unitario
   * @param {number} [cantidad=1] - Cantidad a agregar
   * 
   * @example
   * addToCart({ id: 'abc123', name: 'Hamburguesa', price: 15000 }, 2);
   */
  addToCart: (producto, cantidad = 1) => {
    // Validaciones
    if (!producto || !producto.id) {
      console.error('[cartStore] addToCart: producto inválido');
      return;
    }
    if (cantidad < 1) {
      console.warn('[cartStore] addToCart: cantidad debe ser >= 1');
      return;
    }

    const itemExistente = get().items.find((item) => item.id === producto.id);

    if (itemExistente) {
      // Producto existe: incrementar cantidad
      set((state) => ({
        items: state.items.map((item) =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + cantidad }
            : item
        ),
      }));
    } else {
      // Producto nuevo: agregar al carrito
      set((state) => ({
        items: [...state.items, { ...producto, quantity: cantidad }],
      }));
    }
  },

  /**
   * Elimina un producto completamente del carrito.
   * 
   * @param {string} idProducto - ID del producto a eliminar
   * 
   * @example
   * removeFromCart('abc123');
   */
  removeFromCart: (idProducto) => {
    if (!idProducto) {
      console.warn('[cartStore] removeFromCart: ID requerido');
      return;
    }

    set((state) => ({
      items: state.items.filter((item) => item.id !== idProducto),
    }));
  },

  /**
   * Actualiza la cantidad de un producto específico.
   * Si la cantidad es 0 o menor, elimina el producto.
   * 
   * @param {string} idProducto - ID del producto
   * @param {number} nuevaCantidad - Nueva cantidad
   * 
   * @example
   * updateQuantity('abc123', 3); // Establecer cantidad a 3
   * updateQuantity('abc123', 0); // Eliminar del carrito
   */
  updateQuantity: (idProducto, nuevaCantidad) => {
    if (!idProducto) {
      console.warn('[cartStore] updateQuantity: ID requerido');
      return;
    }

    if (nuevaCantidad <= 0) {
      // Cantidad 0 o negativa: eliminar el producto
      get().removeFromCart(idProducto);
    } else {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === idProducto
            ? { ...item, quantity: nuevaCantidad }
            : item
        ),
      }));
    }
  },

  /**
   * Vacía completamente el carrito.
   * Se llama después de completar una compra.
   */
  clearCart: () => {
    set({ items: [] });
  },

  // ---------------------------------------------------------------------------
  // CÁLCULOS
  // ---------------------------------------------------------------------------

  /**
   * Calcula el total del carrito (suma de precio * cantidad de cada item).
   * No incluye tarifas de servicio ni envío.
   * 
   * @returns {number} Total del carrito en COP
   * 
   * @example
   * const total = getCartTotal(); // 45000
   */
  getCartTotal: () => {
    return get().items.reduce((total, item) => {
      const precio = Number(item.price) || 0;
      const cantidad = Number(item.quantity) || 0;
      return total + (precio * cantidad);
    }, 0);
  },

  /**
   * Obtiene la cantidad total de items en el carrito.
   * Suma las cantidades de todos los productos.
   * 
   * @returns {number} Número total de items
   * 
   * @example
   * // Si hay 2 hamburguesas y 1 refresco
   * getCartItemCount(); // 3
   */
  getCartItemCount: () => {
    return get().items.reduce((total, item) => {
      return total + (Number(item.quantity) || 0);
    }, 0);
  },

  /**
   * Obtiene la cantidad de un producto específico en el carrito.
   * 
   * @param {string} idProducto - ID del producto
   * @returns {number} Cantidad del producto (0 si no está en el carrito)
   */
  getProductQuantity: (idProducto) => {
    if (!idProducto) return 0;
    const item = get().items.find((i) => i.id === idProducto);
    return item?.quantity || 0;
  },

  /**
   * Verifica si el carrito está vacío.
   * 
   * @returns {boolean} True si no hay items
   */
  isEmpty: () => {
    return get().items.length === 0;
  },

  /**
   * Verifica si todos los items son del mismo store.
   * Importante para validar pedidos (no mezclar tiendas).
   * 
   * @returns {boolean} True si todos los items son del mismo store
   */
  isSingleStore: () => {
    const items = get().items;
    if (items.length === 0) return true;

    const primerStoreId = items[0].store_id;
    return items.every((item) => item.store_id === primerStoreId);
  },

  /**
   * Obtiene el ID de la tienda de los items (asumiendo single store).
   * 
   * @returns {string|null} ID de la tienda o null si carrito vacío
   */
  getStoreId: () => {
    const items = get().items;
    return items.length > 0 ? items[0].store_id : null;
  },

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  /**
   * Resetea el carrito al estado inicial.
   * Útil para logout o cambio de usuario.
   */
  reset: () => {
    set({ ...estadoInicialCarrito, isInitialized: false });
  }
}));

// =============================================================================
// EXPORTACIONES
// =============================================================================

export { createCartStore };

export default createCartStore;