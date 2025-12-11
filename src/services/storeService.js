/**
 * =============================================================================
 * SERVICIO DE TIENDA (storeService)
 * =============================================================================
 * 
 * Este módulo proporciona funciones para gestionar las operaciones de tiendas
 * en la plataforma MiOriente. Incluye operaciones CRUD para productos, 
 * gestión de pedidos y estadísticas de ventas.
 * 
 * @module services/storeService
 * @requires @/lib/customSupabaseClient
 * 
 * FUNCIONES DISPONIBLES:
 * ----------------------
 * 1. obtenerTiendaPorPropietario  - Obtiene datos de tienda por ID del dueño
 * 2. obtenerEstadisticas          - Retorna métricas de ventas de la tienda
 * 3. obtenerProductos             - Lista todos los productos de una tienda
 * 4. obtenerPedidos               - Lista pedidos con detalles completos
 * 5. actualizarEstadoPedido       - Cambia el estado de un pedido
 * 6. obtenerIngresosMensuales     - Calcula ventas agrupadas por mes
 * 7. crearProducto                - Registra un nuevo producto
 * 8. eliminarProducto             - Borra un producto existente
 * 9. actualizarProducto           - Modifica datos de un producto
 * 
 * EJEMPLO DE USO:
 * ---------------
 * import { storeService } from '@/services/storeService';
 * const tienda = await storeService.obtenerTiendaPorPropietario(userId);
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

export const storeService = {
  /**
   * Obtiene la información de una tienda por el ID del propietario.
   * Incluye la categoría de servicio asociada.
   * 
   * @async
   * @function obtenerTiendaPorPropietario
   * @param {string} idPropietario - UUID del usuario propietario de la tienda
   * @returns {Promise<Object|null>} Datos de la tienda o null si no existe
   * @throws {Error} Si ocurre un error en la consulta a la base de datos
   * 
   * @example
   * const miTienda = await storeService.obtenerTiendaPorPropietario('uuid-123');
   */
  async getStoreByOwner(idPropietario) {
    const { data, error } = await supabase
      .from('stores')
      .select('*, service_categories(name)')
      .eq('owner_id', idPropietario)
      .maybeSingle();

    if (error) {
      console.error('[storeService.getStoreByOwner] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Obtiene las estadísticas de ventas de una tienda.
   * Utiliza una función RPC de Supabase para cálculos optimizados.
   * 
   * @async
   * @function obtenerEstadisticas
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Object>} Objeto con estadísticas (total_ventas, total_productos, etc.)
   * @throws {Error} Si la función RPC falla
   * 
   * @example
   * const stats = await storeService.getStoreStats('tienda-uuid');
   * console.log(stats.total_ventas);
   */
  async getStoreStats(idTienda) {
    const { data, error } = await supabase.rpc('get_store_stats', { p_store_id: idTienda });

    if (error) {
      console.error('[storeService.getStoreStats] Error:', error.message);
      throw error;
    }
    return data?.[0] || {};
  },

  /**
   * Obtiene todos los productos de una tienda ordenados por fecha de creación.
   * 
   * @async
   * @function obtenerProductos
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array>} Lista de productos con todos sus campos
   * @throws {Error} Si la consulta falla
   * 
   * @example
   * const productos = await storeService.getProducts('tienda-uuid');
   */
  async getProducts(idTienda) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', idTienda)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[storeService.getProducts] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Obtiene los pedidos de una tienda con información completa.
   * Incluye: perfil del cliente, items del pedido, productos y entregas.
   * 
   * @async
   * @function obtenerPedidos
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array>} Lista de pedidos con relaciones anidadas
   * @throws {Error} Si la consulta falla
   * 
   * @example
   * const pedidos = await storeService.getOrders('tienda-uuid');
   * pedidos.forEach(p => console.log(p.profiles.full_name));
   */
  async getOrders(idTienda) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *, 
        profiles(full_name, phone, email), 
        order_items(id, quantity, price, products!order_items_product_id_fkey(name, image_url)),
        deliveries(status, delivery_person_id, profiles(full_name, phone))
      `)
      .eq('store_id', idTienda)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[storeService.getOrders] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Actualiza el estado de un pedido.
   * Estados válidos: 'Pendiente', 'En preparación', 'En camino', 'Entregado', 'Cancelado'
   * 
   * @async
   * @function actualizarEstadoPedido
   * @param {string} idPedido - UUID del pedido a actualizar
   * @param {string} nuevoEstado - Nuevo estado del pedido
   * @returns {Promise<Object>} Pedido actualizado
   * @throws {Error} Si el pedido no existe o la actualización falla
   * 
   * @example
   * await storeService.updateOrderStatus('pedido-uuid', 'Entregado');
   */
  async updateOrderStatus(idPedido, nuevoEstado) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: nuevoEstado })
      .eq('id', idPedido)
      .select()
      .single();

    if (error) {
      console.error('[storeService.updateOrderStatus] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Calcula los ingresos mensuales de una tienda.
   * Solo considera pedidos con estado 'Entregado'.
   * Retorna datos formateados para gráficos.
   * 
   * @async
   * @function obtenerIngresosMensuales
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array<{month: string, total: number}>>} Ingresos por mes
   * @throws {Error} Si la consulta falla
   * 
   * @example
   * const ventas = await storeService.getMonthlyIncome('tienda-uuid');
   * // Retorna: [{ month: 'ene', total: 150000 }, ...]
   */
  async getMonthlyIncome(idTienda) {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total')
      .eq('store_id', idTienda)
      .eq('status', 'Entregado')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[storeService.getMonthlyIncome] Error:', error.message);
      throw error;
    }

    // Agrupar ventas por mes para visualización en gráficos
    const ventasPorMes = {};
    data?.forEach(pedido => {
      const fecha = new Date(pedido.created_at);
      const mes = fecha.toLocaleString('es-CO', { month: 'short' });
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + Number(pedido.total);
    });

    return Object.entries(ventasPorMes).map(([month, total]) => ({ month, total }));
  },

  /**
   * Crea un nuevo producto en la tienda.
   * 
   * @async
   * @function crearProducto
   * @param {Object} datosProducto - Datos del producto a crear
   * @param {string} datosProducto.store_id - UUID de la tienda
   * @param {string} datosProducto.name - Nombre del producto
   * @param {number} datosProducto.price - Precio en pesos colombianos
   * @param {number} datosProducto.stock - Cantidad disponible
   * @param {string} [datosProducto.description] - Descripción opcional
   * @param {string} [datosProducto.image_url] - URL de imagen opcional
   * @returns {Promise<Object>} Producto creado con su ID
   * @throws {Error} Si faltan campos requeridos o la inserción falla
   * 
   * @example
   * const nuevoProducto = await storeService.createProduct({
   *   store_id: 'tienda-uuid',
   *   name: 'Aguacate Hass',
   *   price: 5000,
   *   stock: 50
   * });
   */
  async createProduct(datosProducto) {
    // Validación básica de campos requeridos
    if (!datosProducto.store_id || !datosProducto.name) {
      throw new Error('Campos requeridos: store_id, name');
    }

    const { data, error } = await supabase
      .from('products')
      .insert(datosProducto)
      .select()
      .single();

    if (error) {
      console.error('[storeService.createProduct] Error:', error.message);
      throw error;
    }
    return data;
  },

  /**
   * Elimina un producto de la base de datos.
   * 
   * @async
   * @function eliminarProducto
   * @param {string} idProducto - UUID del producto a eliminar
   * @returns {Promise<boolean>} true si la eliminación fue exitosa
   * @throws {Error} Si el producto no existe o la eliminación falla
   * 
   * @example
   * await storeService.deleteProduct('producto-uuid');
   */
  async deleteProduct(idProducto) {
    if (!idProducto) {
      throw new Error('Se requiere el ID del producto');
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', idProducto);

    if (error) {
      console.error('[storeService.deleteProduct] Error:', error.message);
      throw error;
    }
    return true;
  },

  /**
   * Actualiza los datos de un producto existente.
   * 
   * @async
   * @function actualizarProducto
   * @param {string} idProducto - UUID del producto a actualizar
   * @param {Object} actualizaciones - Campos a modificar
   * @returns {Promise<Object>} Producto con datos actualizados
   * @throws {Error} Si el producto no existe o la actualización falla
   * 
   * @example
   * const actualizado = await storeService.updateProduct('producto-uuid', {
   *   price: 6000,
   *   stock: 30
   * });
   */
  async updateProduct(idProducto, actualizaciones) {
    if (!idProducto) {
      throw new Error('Se requiere el ID del producto');
    }

    const { data, error } = await supabase
      .from('products')
      .update(actualizaciones)
      .eq('id', idProducto)
      .select()
      .single();

    if (error) {
      console.error('[storeService.updateProduct] Error:', error.message);
      throw error;
    }
    return data;
  }
};
