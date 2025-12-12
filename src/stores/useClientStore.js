/**
 * =============================================================================
 * STORE DEL CLIENTE (useClientStore.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo implementa el store de Zustand para el dashboard del cliente.
 *   Gestiona el estado del perfil, pedidos activos, historial y direcciones.
 * 
 * Responsabilidades:
 *   - Cargar y gestionar perfil del cliente
 *   - Gestionar pedidos activos (en proceso)
 *   - Gestionar historial de pedidos
 *   - Gestionar direcciones de entrega guardadas
 * 
 * Uso:
 *   import { useClientStore } from '@/stores/useClientStore';
 *   const { profile, activeOrders, fetchClientData } = useClientStore();
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { create } from 'zustand';
import { customerService } from '@/services/customerService';

// =============================================================================
// STORE PRINCIPAL
// =============================================================================

export const useClientStore = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------------------------

  /** Perfil del cliente actual */
  profile: null,

  /** Pedidos activos (pendientes, en preparación, en camino, etc.) */
  activeOrders: [],

  /** Historial de pedidos completados o cancelados */
  orderHistory: [],

  /** Direcciones de entrega guardadas */
  addresses: [],

  /** Indica si se están cargando datos */
  isLoading: false,

  /** Mensaje de error si ocurre alguno */
  error: null,

  // ---------------------------------------------------------------------------
  // SETTERS SIMPLES
  // ---------------------------------------------------------------------------

  /**
   * Establece el perfil directamente.
   * @param {Object} profile - Datos del perfil
   */
  setProfile: (profile) => set({ profile }),

  /**
   * Limpia el error actual.
   */
  clearError: () => set({ error: null }),

  // ---------------------------------------------------------------------------
  // CARGA DE DATOS PRINCIPAL
  // ---------------------------------------------------------------------------

  /**
   * Carga todos los datos del cliente (perfil y pedidos activos).
   * Esta es la función principal que se llama al entrar al dashboard.
   * 
   * @param {string} userId - UUID del usuario
   * @returns {Promise<void>}
   * 
   * @example
   * useEffect(() => {
   *   if (user?.id) fetchClientData(user.id);
   * }, [user]);
   */
  fetchClientData: async (userId) => {
    if (!userId) {
      console.warn('[useClientStore] fetchClientData: userId requerido');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Cargar perfil y pedidos activos en paralelo
      const [perfil, pedidosActivos] = await Promise.all([
        customerService.obtenerPerfil(userId).catch(err => {
          console.error('[useClientStore] Error obteniendo perfil:', err);
          return null;
        }),
        customerService.obtenerPedidosActivos(userId).catch(err => {
          console.error('[useClientStore] Error obteniendo pedidos:', err);
          return [];
        })
      ]);

      set({
        profile: perfil,
        activeOrders: pedidosActivos || []
      });
    } catch (error) {
      console.error("[useClientStore] Error cargando datos:", error);
      set({ error: "Error cargando datos del cliente." });
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE DIRECCIONES
  // ---------------------------------------------------------------------------

  /**
   * Carga las direcciones guardadas del cliente.
   * 
   * @param {string} userId - UUID del usuario
   * @returns {Promise<void>}
   */
  fetchAddresses: async (userId) => {
    if (!userId) {
      console.warn('[useClientStore] fetchAddresses: userId requerido');
      return;
    }

    try {
      const direcciones = await customerService.obtenerDirecciones(userId);
      set({ addresses: direcciones || [] });
    } catch (error) {
      console.error("[useClientStore] Error cargando direcciones:", error);
      // No establecer error global (direcciones son opcionales)
    }
  },

  /**
   * Agrega una nueva dirección.
   * 
   * @param {string} userId - UUID del usuario
   * @param {Object} addressData - Datos de la dirección
   * @returns {Promise<Object>} Dirección creada
   */
  addAddress: async (userId, addressData) => {
    if (!userId || !addressData) {
      throw new Error('userId y datos de dirección son requeridos');
    }

    const nuevaDireccion = await customerService.agregarDireccion(userId, addressData);

    set(state => ({
      addresses: [...state.addresses, nuevaDireccion]
    }));

    return nuevaDireccion;
  },

  /**
   * Elimina una dirección.
   * 
   * @param {string} addressId - UUID de la dirección
   * @returns {Promise<void>}
   */
  removeAddress: async (addressId) => {
    if (!addressId) {
      throw new Error('ID de dirección es requerido');
    }

    await customerService.eliminarDireccion(addressId);

    set(state => ({
      addresses: state.addresses.filter(addr => addr.id !== addressId)
    }));
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PEDIDOS
  // ---------------------------------------------------------------------------

  /**
   * Refresca la lista de pedidos activos.
   * 
   * @param {string} userId - UUID del usuario
   * @returns {Promise<void>}
   */
  refreshOrders: async (userId) => {
    if (!userId) {
      console.warn('[useClientStore] refreshOrders: userId requerido');
      return;
    }

    try {
      const pedidosActivos = await customerService.obtenerPedidosActivos(userId);
      set({ activeOrders: pedidosActivos || [] });
    } catch (error) {
      console.error("[useClientStore] Error refrescando pedidos:", error);
    }
  },

  /**
   * Carga el historial de pedidos completados.
   * 
   * @param {string} userId - UUID del usuario
   * @param {number} [limite=20] - Número máximo de pedidos
   * @returns {Promise<void>}
   */
  fetchOrderHistory: async (userId, limite = 20) => {
    if (!userId) return;

    try {
      const historial = await customerService.obtenerHistorialPedidos(userId, limite);
      set({ orderHistory: historial || [] });
    } catch (error) {
      console.error("[useClientStore] Error cargando historial:", error);
    }
  },

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  /**
   * Obtiene la dirección predeterminada del usuario.
   * @returns {Object|null} Dirección predeterminada o null
   */
  getDefaultAddress: () => {
    const addresses = get().addresses;
    return addresses.find(addr => addr.is_default) || addresses[0] || null;
  },

  /**
   * Obtiene el número de pedidos activos.
   * @returns {number} Cantidad de pedidos activos
   */
  getActiveOrderCount: () => {
    return get().activeOrders.length;
  },

  /**
   * Resetea todo el store al estado inicial.
   * Útil al cerrar sesión.
   */
  reset: () => {
    set({
      profile: null,
      activeOrders: [],
      orderHistory: [],
      addresses: [],
      isLoading: false,
      error: null
    });
  }
}));

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default useClientStore;
