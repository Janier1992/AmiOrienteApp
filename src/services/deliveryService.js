/**
 * =============================================================================
 * SERVICIO DE DOMICILIOS (deliveryService)
 * =============================================================================
 * 
 * Este módulo gestiona las operaciones relacionadas con los domiciliarios
 * (repartidores) de la plataforma MiOriente. Incluye la obtención de
 * pedidos disponibles y actualización de ubicación en tiempo real.
 * 
 * @module services/deliveryService
 * @requires @/lib/customSupabaseClient
 * 
 * FUNCIONES DISPONIBLES:
 * ----------------------
 * 1. obtenerPedidosDisponibles - Lista pedidos pendientes de asignación
 * 2. actualizarUbicacion       - Actualiza coordenadas GPS del domiciliario
 * 
 * ESTADOS DE PEDIDOS RELEVANTES:
 * ------------------------------
 * - 'Pendiente'                     : Pedido listo para ser tomado
 * - 'Pendiente de pago en efectivo' : Pedido contra entrega
 * - 'En camino'                     : Domiciliario en ruta
 * - 'Entregado'                     : Pedido completado
 * 
 * EJEMPLO DE USO:
 * ---------------
 * import { deliveryService } from '@/services/deliveryService';
 * const disponibles = await deliveryService.getAvailableOrders();
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

export const deliveryService = {
  /**
   * Obtiene los pedidos disponibles para ser tomados por un domiciliario.
   * Filtra por estados 'Pendiente' y 'Pendiente de pago en efectivo'.
   * 
   * @async
   * @function obtenerPedidosDisponibles
   * @returns {Promise<Array>} Lista de pedidos con información de tienda y cliente
   * @throws {Error} Si la consulta falla
   * 
   * DATOS INCLUIDOS POR PEDIDO:
   * - id, created_at, total, status, delivery_address
   * - stores: { name, address }
   * - profiles: { full_name, phone }
   * 
   * @example
   * const pedidos = await deliveryService.getAvailableOrders();
   * console.log(`${pedidos.length} pedidos disponibles`);
   */
  async getAvailableOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, created_at, total, status, delivery_address,
        stores (name, address),
        profiles (full_name, phone)
      `)
      .or('status.eq.Pendiente,status.eq.Pendiente de pago en efectivo')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[deliveryService.getAvailableOrders] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Actualiza la ubicación GPS del domiciliario en tiempo real.
   * Utiliza upsert para crear o actualizar el registro.
   * 
   * @async
   * @function actualizarUbicacion
   * @param {string} userId - UUID del domiciliario
   * @param {number} lat - Latitud (coordenada GPS)
   * @param {number} lng - Longitud (coordenada GPS)
   * @returns {Promise<void>}
   * @throws {Error} Si las coordenadas son inválidas o la actualización falla
   * 
   * @example
   * // Actualizar ubicación cada 30 segundos
   * await deliveryService.updateLocation('user-uuid', 6.2442, -75.5812);
   */
  async updateLocation(userId, lat, lng) {
    // Validación de parámetros
    if (!userId) {
      throw new Error('Se requiere el ID del domiciliario');
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Las coordenadas deben ser números válidos');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordenadas fuera de rango válido');
    }

    const { error } = await supabase
      .from('delivery_locations')
      .upsert({
        delivery_person_id: userId,
        lat,
        lng,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'delivery_person_id'
      });

    if (error) {
      console.error('[deliveryService.updateLocation] Error:', error.message);
      throw error;
    }
  }
};
