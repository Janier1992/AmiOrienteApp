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

  /** Mensaje de error si ocurre alguno */
  error: null,

  // ---------------------------------------------------------------------------
  // TIMESTAMPS DE CACHÉ
  // ---------------------------------------------------------------------------

  /** Timestamps de última carga para implementar caché */
  lastFetch: {
    stats: 0,
    orders: 0,
    products: 0
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
   * Limpia el error actual.
   */
  clearError: () => set({ error: null }),

  // ---------------------------------------------------------------------------
  // CARGA DE DATOS DE TIENDA
  // ---------------------------------------------------------------------------

  /**
   * Carga los datos de la tienda del usuario.
   * Esta es la función principal que se llama al entrar al dashboard.
   * 
   * @param {string} userId - UUID del usuario propietario
   * @returns {Promise<void>}
   * 
   * @example
   * // Al montar el componente del dashboard
   * useEffect(() => {
   *   if (user?.id) fetchStoreData(user.id);
   * }, [user]);
   */
  fetchStoreData: async (userId) => {
    // Validación
    if (!userId) {
      console.warn('[useStoreDashboard] fetchStoreData: userId requerido');
      return;
    }

    // Evitar cargas duplicadas
    const currentStore = get().store;
    if (currentStore && currentStore.owner_id === userId) {
      return;
    }

    set({ isLoadingStore: true, error: null });

    // Timeout de seguridad para evitar pantallas de carga infinitas
    const timeoutId = setTimeout(() => {
      if (get().isLoadingStore) {
        set({
          isLoadingStore: false,
          error: "Tiempo de espera agotado. Por favor recarga la página."
        });
      }
    }, TIMEOUT_CARGA);

    try {
      // Usar el servicio para obtener datos de tienda
      const datosTienda = await storeService.obtenerTiendaPorPropietario(userId);

      clearTimeout(timeoutId);
      set({ store: datosTienda });

      // Cargar estadísticas en segundo plano si la tienda existe
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

  /**
   * Carga las estadísticas de la tienda.
   * Implementa caché para evitar peticiones frecuentes.
   * 
   * @param {string} storeId - UUID de la tienda
   * @param {boolean} [force=false] - Si true, ignora el caché
   * @returns {Promise<void>}
   */
  fetchStats: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.stats;

    // Usar caché si no ha expirado y no es forzado
    if (!force && ahora - ultimaCarga < DURACION_CACHE && get().stats) {
      return;
    }

    set({ isLoadingStats: true });

    try {
      // Cargar estadísticas e ingresos mensuales en paralelo
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
      // No establecer error global para estadísticas (no es crítico)
    } finally {
      set({ isLoadingStats: false });
    }
  },

  // ---------------------------------------------------------------------------
  // CARGA DE PEDIDOS
  // ---------------------------------------------------------------------------

  /**
   * Carga los pedidos de la tienda.
   * Implementa caché para optimizar rendimiento.
   * 
   * @param {string} storeId - UUID de la tienda
   * @param {boolean} [force=false] - Si true, ignora el caché
   * @returns {Promise<void>}
   */
  fetchOrders: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.orders;

    // Usar caché si no ha expirado
    if (!force && ahora - ultimaCarga < DURACION_CACHE && get().orders.length > 0) {
      return;
    }

    set({ isLoadingOrders: true });

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

  /**
   * Carga los productos de la tienda.
   * Implementa caché para optimizar rendimiento.
   * 
   * @param {string} storeId - UUID de la tienda
   * @param {boolean} [force=false] - Si true, ignora el caché
   * @returns {Promise<void>}
   */
  fetchProducts: async (storeId, force = false) => {
    if (!storeId) return;

    const ahora = Date.now();
    const ultimaCarga = get().lastFetch.products;

    // Usar caché si no ha expirado
    if (!force && ahora - ultimaCarga < DURACION_CACHE && get().products.length > 0) {
      return;
    }

    set({ isLoadingProducts: true });

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
