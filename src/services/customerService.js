/**
 * =============================================================================
 * SERVICIO DE CLIENTE (customerService)
 * =============================================================================
 * 
 * Este módulo proporciona funciones para gestionar las operaciones
 * relacionadas con los clientes/compradores de la plataforma MiOriente.
 * 
 * @module services/customerService
 * @requires @/lib/customSupabaseClient
 * 
 * FUNCIONES DISPONIBLES:
 * ----------------------
 * 1. obtenerPerfil  - Obtiene los datos del perfil del cliente
 * 2. obtenerPedidos - Lista todos los pedidos del cliente
 * 
 * EJEMPLO DE USO:
 * ---------------
 * import { customerService } from '@/services/customerService';
 * const perfil = await customerService.getProfile(userId);
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

export const customerService = {
  /**
   * Obtiene el perfil completo de un cliente.
   * 
   * @async
   * @function obtenerPerfil
   * @param {string} userId - UUID del usuario/cliente
   * @returns {Promise<Object>} Datos del perfil (nombre, teléfono, email, etc.)
   * @throws {Error} Si el usuario no existe o la consulta falla
   * 
   * @example
   * const perfil = await customerService.getProfile('user-uuid');
   * console.log('Nombre:', perfil.full_name);
   */
  async getProfile(userId) {
    if (!userId) {
      throw new Error('Se requiere el ID del usuario');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[customerService.getProfile] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Obtiene todos los pedidos de un cliente con información detallada.
   * Incluye: tienda, estado de entrega, items y productos.
   * 
   * @async
   * @function obtenerPedidos
   * @param {string} userId - UUID del cliente
   * @returns {Promise<Array>} Lista de pedidos ordenados por fecha (más reciente primero)
   * @throws {Error} Si la consulta falla
   * 
   * @example
   * const pedidos = await customerService.getOrders('user-uuid');
   * pedidos.forEach(pedido => {
   *   console.log(`Pedido ${pedido.id}: ${pedido.status}`);
   * });
   */
  async getOrders(userId) {
    if (!userId) {
      throw new Error('Se requiere el ID del usuario');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *, 
        stores (name), 
        deliveries (*), 
        order_items (*, products!order_items_product_id_fkey(name, image_url))
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[customerService.getOrders] Error:', error.message);
      throw error;
    }
    return data;
  }
};
