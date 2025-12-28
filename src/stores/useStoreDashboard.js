/**
 * =============================================================================
 * STORE DEL DASHBOARD DE TIENDA (useStoreDashboard.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo implementa el store de Zustand para el dashboard de tiendas.
 *   Gestiona el estado de la tienda, productos, pedidos y estadísticas.
 *   Implementa caché de datos para optimizar rendimiento.
 * 
 * Responsabilidades:
 *   - Cargar y gestionar datos de la tienda
 *   - Gestionar lista de productos
 *   - Gestionar lista de pedidos
 *   - Cargar estadísticas y métricas
 *   - Implementar caché para evitar peticiones innecesarias
 * 
 * Uso:
 *   import { useStoreDashboard } from '@/stores/useStoreDashboard';
 *   const { store, orders, products, fetchStoreData } = useStoreDashboard();
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { create } from 'zustand';
import { storeService } from '@/services/storeService';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

/** Duración del caché en milisegundos (2 minutos) */
const DURACION_CACHE = 120000;

/** Tiempo máximo de espera para operaciones de carga (15 segundos) */
const TIMEOUT_CARGA = 15000;

// =============================================================================
// STORE PRINCIPAL
// =============================================================================

export const useStoreDashboard = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------------------------

  /** Datos de la tienda del usuario actual */
  store: null,

  /** Estadísticas de la tienda (ventas, pedidos, etc.) */
  stats: null,

  /** Lista de pedidos de la tienda */
  orders: [],

  /** Lista de productos de la tienda */
  products: [],

  /** Lista de clientes de la tienda (Base Model: Usuarios) */
  customers: [],

  /** Mesas del restaurante (Recurso Específico) */
  tables: [],

  // ---------------------------------------------------------------------------
  // ESTADOS DE CARGA (Granulares para mejor UX)
  // ---------------------------------------------------------------------------

  /** Indica si se está cargando la información de la tienda */
  isLoadingStore: false,

  /** Indica si se están cargando las estadísticas */
  isLoadingStats: false,

  /** Indica si se están cargando los pedidos */
  isLoadingOrders: false,

  /** Indica si se están cargando los productos */
  isLoadingProducts: false,

  /** Indica si se están cargando los clientes */
  isLoadingCustomers: false,

  /** Mensaje de error si ocurre alguno */
  error: null,

  // ---------------------------------------------------------------------------
  // TIMESTAMPS DE CACHÉ
  // ---------------------------------------------------------------------------

  /** Timestamps de última carga para implementar caché */
  lastFetch: {
    stats: 0,
    orders: 0,
    products: 0,
    customers: 0
  },

  // ---------------------------------------------------------------------------
  // SETTERS SIMPLES
  // ---------------------------------------------------------------------------

  /**
   * Establece los datos de la tienda directamente.
   * @param {Object} store - Datos de la tienda
   */
  setStore: (store) => set({ store }),

  /**
   * Actualiza la configuración de la tienda.
   * @param {Object} updates - Datos a actualizar
   */
  updateStoreSettings: async (updates) => {
    const currentStore = get().store;
    if (!currentStore) return;

    try {
      const updated = await storeService.actualizarTienda(currentStore.id, updates);
      set({ store: updated });
      return updated;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Carga los clientes de la tienda.
   * @param {string} storeId
   */
  fetchCustomers: async (storeId) => {
    if (!storeId) return;

    const ahora = Date.now();
    // Cache 5 min for customers
    if (ahora - get().lastFetch.customers < 300000 && get().customers.length > 0) return;

    set({ isLoadingCustomers: true });
    try {
      const data = await storeService.obtenerClientesTienda(storeId);
      set(state => ({
        customers: data,
        lastFetch: { ...state.lastFetch, customers: ahora }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoadingCustomers: false });
    }
  },

  /**
   * Carga las mesas (para restaurantes).
   */
  fetchTables: async (storeId) => {
    try {
      const tables = await storeService.getTables(storeId);
      set({ tables });
    } catch (e) {
      console.error('[useStoreDashboard] Error loading tables', e);
    }
  },

  /** Wrapper para transacción POS */
  createPOSTransaction: async (payload) => {
    return storeService.createPOSTransaction(payload);
  },

  /**
   * Limpia el error actual.
   */
  clearError: () => set({ error: null }),

  // ---------------------------------------------------------------------------
  // CARGA DE DATOS DE TIENDA
  // ---------------------------------------------------------------------------

  fetchStoreData: async (userId) => {
    if (!userId) {
      console.warn('[useStoreDashboard] fetchStoreData: userId requerido');
      return;
    }

    const currentStore = get().store;
    // Stale-While-Revalidate: If we have data, don't set loading to true immediately for "hard" loading
    // We can use a separate "isRefetching" state if we wanted to show a small spinner, but for now we just keep data visible.

    if (!currentStore || currentStore.owner_id !== userId) {
      set({ isLoadingStore: true, error: null });
    }

    const timeoutId = setTimeout(() => {
      if (get().isLoadingStore) {
        set({
          isLoadingStore: false,
          error: "Tiempo de espera agotado. Por favor recarga la página."
        });
      }
    }, TIMEOUT_CARGA);

    try {
      const datosTienda = await storeService.obtenerTiendaPorPropietario(userId);

      clearTimeout(timeoutId);
      set({ store: datosTienda });

      if (datosTienda) {
        get().fetchStats(datosTienda.id);
      }
    } catch (error) {
      console.error("[useStoreDashboard] Error cargando tienda:", error);
      clearTimeout(timeoutId);
      set({ error: "No se pudo cargar la información del negocio." });
    } finally {
      set({ isLoadingStore: false });
    }
  },

  // ---------------------------------------------------------------------------
  // CARGA DE ESTADÍSTICAS
  // ---------------------------------------------------------------------------

  fetchStats: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.stats;
    const hasData = !!get().stats;

    // Cache hit: If fresh (< 2 min), do nothing
    if (!force && ahora - ultimaCarga < DURACION_CACHE && hasData) {
      return;
    }

    // Stale-While-Revalidate: Only show full loader if we have NO data
    if (!hasData) set({ isLoadingStats: true });

    try {
      const [estadisticas, ingresosMensuales] = await Promise.all([
        storeService.obtenerEstadisticasTienda(storeId).catch(() => ({})),
        storeService.obtenerIngresosMensuales(storeId).catch(() => [])
      ]);

      set(state => ({
        stats: { ...estadisticas, monthlyIncome: ingresosMensuales },
        lastFetch: { ...state.lastFetch, stats: ahora }
      }));
    } catch (error) {
      console.error("[useStoreDashboard] Error cargando estadísticas:", error);
    } finally {
      set({ isLoadingStats: false });
    }
  },

  // ---------------------------------------------------------------------------
  // CARGA DE PEDIDOS
  // ---------------------------------------------------------------------------

  fetchOrders: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.orders;
    const hasData = get().orders.length > 0;

    // Cache hit
    if (!force && ahora - ultimaCarga < DURACION_CACHE && hasData) {
      return;
    }

    // SWR: Only loading if no data
    if (!hasData) set({ isLoadingOrders: true });

    try {
      const listaPedidos = await storeService.obtenerPedidos(storeId);

      set(state => ({
        orders: listaPedidos,
        lastFetch: { ...state.lastFetch, orders: ahora }
      }));
    } catch (error) {
      console.error("[useStoreDashboard] Error cargando pedidos:", error);
    } finally {
      set({ isLoadingOrders: false });
    }
  },

  // ---------------------------------------------------------------------------
  // CARGA DE PRODUCTOS
  // ---------------------------------------------------------------------------

  fetchProducts: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.products;
    const hasData = get().products.length > 0;

    if (!force && ahora - ultimaCarga < DURACION_CACHE && hasData) {
      return;
    }

    // SWR
    if (!hasData) set({ isLoadingProducts: true });

    try {
      const listaProductos = await storeService.obtenerProductos(storeId);

      set(state => ({
        products: listaProductos,
        lastFetch: { ...state.lastFetch, products: ahora }
      }));
    } catch (error) {
      console.error("[useStoreDashboard] Error cargando productos:", error);
    } finally {
      set({ isLoadingProducts: false });
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PEDIDOS
  // ---------------------------------------------------------------------------

  /**
   * Actualiza el estado de un pedido.
   * Actualiza el estado local optimísticamente.
   * 
   * @param {string} orderId - UUID del pedido
   * @param {string} status - Nuevo estado del pedido
   * @returns {Promise<void>}
   * @throws {Error} Si la actualización falla
   */
  updateOrderStatus: async (orderId, status) => {
    if (!orderId || !status) {
      throw new Error('ID del pedido y estado son requeridos');
    }

    try {
      await storeService.actualizarEstadoPedido(orderId, status);

      // Actualización optimística del estado local
      set(state => ({
        orders: state.orders.map(pedido =>
          pedido.id === orderId ? { ...pedido, status } : pedido
        )
      }));
    } catch (error) {
      console.error("[useStoreDashboard] Error actualizando pedido:", error);
      throw error;
    }
  },

  /**
   * Elimina un pedido.
   * @param {string} orderId
   */
  deleteOrder: async (orderId) => {
    if (!orderId) throw new Error('ID requerido');
    try {
      await storeService.eliminarPedido(orderId);
      set(state => ({
        orders: state.orders.filter(o => o.id !== orderId)
      }));
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PRODUCTOS
  // ---------------------------------------------------------------------------

  /**
   * Agrega un nuevo producto a la tienda.
   * Actualiza el estado local y las estadísticas.
   * 
   * @param {Object} productData - Datos del nuevo producto
   * @returns {Promise<Object>} Producto creado
   * @throws {Error} Si la creación falla
   */
  addProduct: async (productData) => {
    if (!productData) {
      throw new Error('Datos del producto son requeridos');
    }

    try {
      const nuevoProducto = await storeService.crearProducto(productData);

      // Actualizar estado local
      set(state => ({
        products: [nuevoProducto, ...state.products],
        stats: state.stats
          ? {
            ...state.stats,
            total_products: Number(state.stats?.total_products || 0) + 1
          }
          : state.stats
      }));

      return nuevoProducto;
    } catch (error) {
      console.error("[useStoreDashboard] Error creando producto:", error);
      throw error;
    }
  },

  /**
   * Actualiza un producto existente.
   * 
   * @param {string} productId - UUID del producto
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  updateProduct: async (productId, updates) => {
    if (!productId || !updates) {
      throw new Error('ID del producto y actualizaciones son requeridos');
    }

    try {
      const productoActualizado = await storeService.actualizarProducto(productId, updates);

      // Actualizar estado local
      set(state => ({
        products: state.products.map(producto =>
          producto.id === productId ? { ...producto, ...productoActualizado } : producto
        )
      }));

      return productoActualizado;
    } catch (error) {
      console.error("[useStoreDashboard] Error actualizando producto:", error);
      throw error;
    }
  },

  /**
   * Elimina un producto de la tienda.
   * 
   * @param {string} productId - UUID del producto a eliminar
   * @returns {Promise<void>}
   * @throws {Error} Si la eliminación falla
   */
  deleteProduct: async (productId) => {
    if (!productId) {
      throw new Error('ID del producto es requerido');
    }

    try {
      await storeService.eliminarProducto(productId);

      // Actualizar estado local
      set(state => ({
        products: state.products.filter(producto => producto.id !== productId),
        stats: state.stats
          ? {
            ...state.stats,
            total_products: Math.max(0, Number(state.stats?.total_products || 0) - 1)
          }
          : state.stats
      }));
    } catch (error) {
      console.error("[useStoreDashboard] Error eliminando producto:", error);
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  /**
   * Invalida el caché para forzar recarga de datos.
   */
  invalidateCache: () => {
    set({
      lastFetch: {
        stats: 0,
        orders: 0,
        products: 0
      }
    });
  },

  /**
   * Resetea todo el store al estado inicial.
   * Útil al cerrar sesión.
   */
  reset: () => {
    set({
      store: null,
      stats: null,
      orders: [],
      products: [],
      isLoadingStore: false,
      isLoadingStats: false,
      isLoadingOrders: false,
      isLoadingProducts: false,
      error: null,
      lastFetch: { stats: 0, orders: 0, products: 0 }
    });
  }
}));

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default useStoreDashboard;
