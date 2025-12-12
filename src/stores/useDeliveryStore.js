/**
 * =============================================================================
 * STORE DEL DOMICILIARIO (useDeliveryStore.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo implementa el store de Zustand para el dashboard del domiciliario.
 *   Gestiona el estado de disponibilidad, entregas, ubicación y ganancias.
 * 
 * Responsabilidades:
 *   - Gestionar estado online/offline del domiciliario
 *   - Cargar pedidos disponibles para entrega
 *   - Gestionar la entrega activa
 *   - Actualizar ubicación en tiempo real
 *   - Calcular y mostrar ganancias
 * 
 * Flujo de Trabajo:
 *   1. Domiciliario se pone "online"
 *   2. Ve lista de pedidos disponibles
 *   3. Acepta un pedido → se convierte en entrega activa
 *   4. Actualiza estado: Recogido → En camino → Entregado
 *   5. La entrega se completa y puede tomar otra
 * 
 * Uso:
 *   import { useDeliveryStore } from '@/stores/useDeliveryStore';
 *   const { isOnline, availableOrders, currentDelivery } = useDeliveryStore();
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { create } from 'zustand';
import { deliveryService } from '@/services/deliveryService';

// =============================================================================
// STORE PRINCIPAL
// =============================================================================

export const useDeliveryStore = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------------------------

  /** Perfil del domiciliario */
  profile: null,

  /** Lista de pedidos disponibles para tomar */
  availableOrders: [],

  /** Entrega actual en proceso (null si no hay ninguna) */
  currentDelivery: null,

  /** Historial de entregas completadas */
  deliveryHistory: [],

  /** Ganancias del domiciliario */
  earnings: {
    today: 0,
    week: 0,
    total: 0
  },

  /** Indica si el domiciliario está disponible para recibir pedidos */
  isOnline: false,

  /** Indica si se están cargando datos */
  isLoading: false,

  /** Mensaje de error si ocurre alguno */
  error: null,

  /** Ubicación actual del domiciliario */
  location: null,

  // ---------------------------------------------------------------------------
  // GESTIÓN DE ESTADO ONLINE
  // ---------------------------------------------------------------------------

  /**
   * Cambia el estado online/offline del domiciliario.
   * 
   * @param {boolean} status - true para online, false para offline
   * 
   * @example
   * toggleOnlineStatus(true); // Ponerse disponible
   */
  toggleOnlineStatus: (status) => set({ isOnline: status }),

  /**
   * Actualiza la ubicación actual del domiciliario.
   * 
   * @param {Object} coords - Coordenadas
   * @param {number} coords.lat - Latitud
   * @param {number} coords.lng - Longitud
   */
  setLocation: (coords) => set({ location: coords }),

  // ---------------------------------------------------------------------------
  // CARGA DE DATOS PRINCIPAL
  // ---------------------------------------------------------------------------

  /**
   * Carga todos los datos del dashboard del domiciliario.
   * 
   * @param {string} userId - UUID del usuario
   * @returns {Promise<void>}
   */
  fetchDashboardData: async (userId) => {
    if (!userId) {
      console.warn('[useDeliveryStore] fetchDashboardData: userId requerido');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Cargar datos en paralelo
      const [disponibles, entregaActual] = await Promise.all([
        deliveryService.obtenerPedidosDisponibles().catch(err => {
          console.error('[useDeliveryStore] Error obteniendo disponibles:', err);
          return [];
        }),
        deliveryService.obtenerEntregaActual(userId).catch(err => {
          console.error('[useDeliveryStore] Error obteniendo entrega actual:', err);
          return null;
        })
      ]);

      set({
        availableOrders: disponibles || [],
        currentDelivery: entregaActual
      });
    } catch (error) {
      console.error("[useDeliveryStore] Error cargando datos:", error);
      set({ error: "Error cargando panel de domiciliario." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Refresca la lista de pedidos disponibles.
   * 
   * @returns {Promise<void>}
   */
  refreshAvailableOrders: async () => {
    try {
      const disponibles = await deliveryService.obtenerPedidosDisponibles();
      set({ availableOrders: disponibles || [] });
    } catch (error) {
      console.error("[useDeliveryStore] Error refrescando disponibles:", error);
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE ENTREGA
  // ---------------------------------------------------------------------------

  /**
   * Acepta un pedido para entrega.
   * 
   * @param {string} orderId - UUID del pedido
   * @param {string} userId - UUID del domiciliario
   * @returns {Promise<boolean>} true si se aceptó correctamente
   * @throws {Error} Si ya está tomado o hay error
   * 
   * @example
   * try {
   *   await acceptOrder('uuid-pedido', 'uuid-domiciliario');
   *   // Pedido aceptado exitosamente
   * } catch (error) {
   *   console.error('El pedido ya fue tomado');
   * }
   */
  acceptOrder: async (orderId, userId) => {
    if (!orderId || !userId) {
      throw new Error('orderId y userId son requeridos');
    }

    try {
      await deliveryService.aceptarEntrega(orderId, userId);

      // Refrescar datos después de aceptar
      await get().fetchDashboardData(userId);

      return true;
    } catch (error) {
      console.error("[useDeliveryStore] Error aceptando pedido:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de la entrega actual.
   * 
   * Estados válidos: 'Asignado', 'Recogido', 'En camino', 'Entregado'
   * 
   * @param {string} orderId - UUID del pedido
   * @param {string} newStatus - Nuevo estado
   * @returns {Promise<boolean>} true si se actualizó correctamente
   * 
   * @example
   * // El domiciliario recogió el pedido
   * await updateDeliveryStatus('uuid-pedido', 'Recogido');
   */
  updateDeliveryStatus: async (orderId, newStatus) => {
    if (!orderId || !newStatus) {
      throw new Error('orderId y newStatus son requeridos');
    }

    try {
      await deliveryService.actualizarEstadoEntrega(orderId, newStatus);

      // Actualización optimística del estado local
      const entregaActual = get().currentDelivery;
      if (entregaActual && (entregaActual.order_id === orderId || entregaActual.orders?.id === orderId)) {
        // Si se completó la entrega, limpiar currentDelivery
        if (newStatus === 'Entregado') {
          set({ currentDelivery: null });
        } else {
          set({
            currentDelivery: { ...entregaActual, status: newStatus }
          });
        }
      }

      return true;
    } catch (error) {
      console.error("[useDeliveryStore] Error actualizando estado:", error);
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // UBICACIÓN EN TIEMPO REAL
  // ---------------------------------------------------------------------------

  /**
   * Actualiza la ubicación del domiciliario en el servidor.
   * Debe llamarse periódicamente cuando está en una entrega.
   * 
   * @param {string} userId - UUID del domiciliario
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Promise<void>}
   */
  updateServerLocation: async (userId, lat, lng) => {
    if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
      return;
    }

    try {
      await deliveryService.actualizarUbicacion(userId, lat, lng);
      set({ location: { lat, lng } });
    } catch (error) {
      // No propagar error (no es crítico)
      console.warn("[useDeliveryStore] Error actualizando ubicación:", error);
    }
  },

  // ---------------------------------------------------------------------------
  // ESTADÍSTICAS Y GANANCIAS
  // ---------------------------------------------------------------------------

  /**
   * Carga las estadísticas del domiciliario.
   * 
   * @param {string} userId - UUID del domiciliario
   * @returns {Promise<void>}
   */
  fetchEarnings: async (userId) => {
    if (!userId) return;

    try {
      const stats = await deliveryService.obtenerEstadisticas(userId);
      set({
        earnings: {
          ...get().earnings,
          total: stats.gananciaTotal || 0
        }
      });
    } catch (error) {
      console.error("[useDeliveryStore] Error cargando ganancias:", error);
    }
  },

  /**
   * Carga el historial de entregas.
   * 
   * @param {string} userId - UUID del domiciliario
   * @param {number} [limite=20] - Número máximo de entregas
   */
  fetchDeliveryHistory: async (userId, limite = 20) => {
    if (!userId) return;

    try {
      const historial = await deliveryService.obtenerHistorialEntregas(userId, limite);
      set({ deliveryHistory: historial || [] });
    } catch (error) {
      console.error("[useDeliveryStore] Error cargando historial:", error);
    }
  },

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  /**
   * Verifica si el domiciliario tiene una entrega activa.
   * @returns {boolean}
   */
  hasActiveDelivery: () => {
    return get().currentDelivery !== null;
  },

  /**
   * Obtiene el número de pedidos disponibles.
   * @returns {number}
   */
  getAvailableCount: () => {
    return get().availableOrders.length;
  },

  /**
   * Resetea todo el store al estado inicial.
   * Útil al cerrar sesión.
   */
  reset: () => {
    set({
      profile: null,
      availableOrders: [],
      currentDelivery: null,
      deliveryHistory: [],
      earnings: { today: 0, week: 0, total: 0 },
      isOnline: false,
      isLoading: false,
      error: null,
      location: null
    });
  }
}));

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default useDeliveryStore;
