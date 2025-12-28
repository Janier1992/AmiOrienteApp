/**
 * =============================================================================
 * SERVICIO DE TIENDA (storeService.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las operaciones de base de datos relacionadas
 *   con las tiendas/negocios aliados de la plataforma MiOriente.
 * 
 * Responsabilidades:
 *   - Obtener información de tiendas por propietario
 *   - Gestionar productos de una tienda
 *   - Gestionar pedidos de una tienda
 *   - Obtener estadísticas y reportes de ventas
 * 
 * Uso:
 *   import { storeService } from '@/services/storeService';
 *   const tienda = await storeService.obtenerTiendaPorPropietario(userId);
 * 
 * Dependencias:
 *   - Supabase Client (@/lib/customSupabaseClient)
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * @typedef {Object} Store
 * @property {string} id - UUID de la tienda
 * @property {string} owner_id - UUID del propietario
 * @property {string} name - Nombre del negocio
 * @property {string} category - Categoría (Ej: Papelería)
 * @property {string} [image_url] - Logo de la tienda
 */

/**
 * @typedef {Object} Product
 * @property {string} id - UUID del producto
 * @property {string} store_id - UUID de la tienda
 * @property {string} name - Nombre del producto
 * @property {number} price - Precio unitario
 * @property {number} stock - Cantidad disponible
 * @property {string} [description] - Descripción detallada
 * @property {string} [image_url] - URL de la imagen
 */

/**
 * @typedef {Object} Order
 * @property {string} id - UUID del pedido
 * @property {string} store_id - UUID de la tienda
 * @property {string} customer_id - UUID del cliente
 * @property {number} total - Monto total
 * @property {string} status - Estado (Pendiente, Entregado, etc.)
 * @property {string} created_at - Timestamp de creación
 */

// =============================================================================
// CONSTANTES DEL MÓDULO
// =============================================================================

/** Mensaje de error genérico para operaciones de tienda */
const ERROR_TIENDA_NO_ENCONTRADA = 'No se encontró la tienda solicitada';
const ERROR_PRODUCTOS_NO_CARGADOS = 'No se pudieron cargar los productos';
const ERROR_PEDIDOS_NO_CARGADOS = 'No se pudieron cargar los pedidos';
const ERROR_ESTADISTICAS_NO_CARGADAS = 'No se pudieron cargar las estadísticas';

// =============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Valida que un ID sea válido (no nulo, no vacío).
 * 
 * @param {string} id - El ID a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje de error
 * @throws {Error} Si el ID es inválido
 */
function validarId(id, nombreCampo = 'ID') {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`${nombreCampo} es requerido y debe ser una cadena válida`);
  }
}

/**
 * Maneja errores de Supabase y los transforma en mensajes amigables.
 * 
 * @param {Error} error - Error original de Supabase
 * @param {string} mensajeContexto - Contexto del error para logging
 * @throws {Error} Error con mensaje amigable en español
 */
function manejarErrorSupabase(error, mensajeContexto) {
  console.error(`[storeService] ${mensajeContexto}:`, error);

  // Errores comunes de Supabase
  if (error.code === 'PGRST116') {
    throw new Error('No se encontraron resultados');
  }
  if (error.code === '23503') {
    throw new Error('Referencia a un registro que no existe');
  }
  if (error.code === '23505') {
    throw new Error('Ya existe un registro con esos datos');
  }

  throw new Error(error.message || mensajeContexto);
}

// =============================================================================
// SERVICIO PRINCIPAL DE TIENDA
// =============================================================================

// Helper for Variants (Clothing)
const parseVariants = (product) => {
  if (!product) return product;
  let variants = [];
  const variantsMatch = product.description?.match(/VARIANTS_JSON:\s*(\[.*\])/s);
  let cleanDesc = product.description || '';

  if (variantsMatch) {
    try {
      variants = JSON.parse(variantsMatch[1]);
      cleanDesc = product.description.replace(/\n\nVARIANTS_JSON:\s*\[.*\]/s, '');
    } catch (e) {
      console.error('Error parsing variants', e);
    }
  }
  return { ...product, variants, description: cleanDesc, full_description: product.description };
};

export const storeService = {

  // ---------------------------------------------------------------------------
  // OPERACIONES DE TIENDA
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // OPERACIONES DE TIENDA
  // ---------------------------------------------------------------------------

  /**
   * Obtiene la información de una tienda por el ID de su propietario.
   * 
   * @param {string} idPropietario - UUID del usuario propietario de la tienda
   * @returns {Promise<Object|null>} Datos de la tienda o null si no existe
   */
  async obtenerTiendaPorPropietario(idPropietario) {
    validarId(idPropietario, 'ID del propietario');

    try {
      const { data: datosTienda, error } = await supabase
        .from('stores')
        .select('*, service_categories(name)')
        .eq('owner_id', idPropietario)
        .maybeSingle();

      if (error) {
        manejarErrorSupabase(error, ERROR_TIENDA_NO_ENCONTRADA);
      }

      return datosTienda;
    } catch (error) {
      manejarErrorSupabase(error, ERROR_TIENDA_NO_ENCONTRADA);
    }
  },

  /**
   * Actualiza la información de una tienda.
   * 
   * @param {string} idTienda - UUID de la tienda
   * @param {Object} datos - Datos a actualizar
   */
  async actualizarTienda(idTienda, datos) {
    validarId(idTienda, 'ID de la tienda');

    try {
      const { data, error } = await supabase
        .from('stores')
        .update(datos)
        .eq('id', idTienda)
        .select()
        .single();

      if (error) manejarErrorSupabase(error, 'Error actualizando tienda');
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene los clientes que han comprado en la tienda.
   * Se basa en el historial de pedidos.
   */
  async obtenerClientesTienda(idTienda) {
    validarId(idTienda, 'ID de la tienda');

    try {
      // Obtener pedidos únicos por cliente
      const { data, error } = await supabase
        .from('orders')
        .select(`
                  customer_id,
                  profiles:customer_id (id, full_name, email, phone, avatar_url),
                  created_at,
                  total
              `)
        .eq('store_id', idTienda)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar para obtener clientes únicos y sus estadísticas básicas
      const clientesMap = new Map();

      data.forEach(order => {
        if (!order.profiles) return;

        const customerId = order.customer_id;
        if (!clientesMap.has(customerId)) {
          clientesMap.set(customerId, {
            ...order.profiles,
            last_order: order.created_at,
            total_spent: 0,
            total_orders: 0
          });
        }

        const cliente = clientesMap.get(customerId);
        cliente.total_spent += Number(order.total);
        cliente.total_orders += 1;
      });

      return Array.from(clientesMap.values());
    } catch (error) {
      console.error("Error cargando clientes", error);
      return [];
    }
  },

  /**
   * Alias para compatibilidad con código existente.
   * @deprecated Usar obtenerTiendaPorPropietario en su lugar
   */
  async getStoreByOwner(ownerId) {
    return this.obtenerTiendaPorPropietario(ownerId);
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE ESTADÍSTICAS
  // ---------------------------------------------------------------------------

  /**
   * Obtiene las estadísticas generales de una tienda.
   * Utiliza una función RPC de Postgres para cálculos optimizados.
   * 
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Object>} Objeto con estadísticas (total_pedidos, total_productos, etc.)
   * 
   * @example
   * const stats = await storeService.obtenerEstadisticasTienda('uuid-tienda');
   * console.log(stats.total_orders); // 150
   */
  async obtenerEstadisticasTienda(idTienda) {
    validarId(idTienda, 'ID de la tienda');

    try {
      const { data: estadisticas, error } = await supabase
        .rpc('get_store_stats', { p_store_id: idTienda });

      if (error) {
        manejarErrorSupabase(error, ERROR_ESTADISTICAS_NO_CARGADAS);
      }

      // La función RPC retorna un array, tomamos el primer elemento
      return estadisticas?.[0] || {};
    } catch (error) {
      manejarErrorSupabase(error, ERROR_ESTADISTICAS_NO_CARGADAS);
    }
  },

  /** Alias para compatibilidad */
  async getStoreStats(storeId) {
    return this.obtenerEstadisticasTienda(storeId);
  },

  /**
   * Obtiene los ingresos mensuales de una tienda para gráficos.
   * Solo cuenta pedidos con estado 'Entregado'.
   * 
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array<{mes: string, total: number}>>} Array de ingresos por mes
   * 
   * @example
   * const ingresos = await storeService.obtenerIngresosMensuales('uuid-tienda');
   * // [{ mes: 'Ene', total: 500000 }, { mes: 'Feb', total: 750000 }]
   */
  async obtenerIngresosMensuales(idTienda) {
    validarId(idTienda, 'ID de la tienda');

    try {
      const { data: pedidosEntregados, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .eq('store_id', idTienda)
        .eq('status', 'Entregado')
        .order('created_at', { ascending: true });

      if (error) {
        manejarErrorSupabase(error, 'Error obteniendo ingresos mensuales');
      }

      // Agrupar ventas por mes
      const ventasPorMes = {};
      pedidosEntregados?.forEach(pedido => {
        const fechaPedido = new Date(pedido.created_at);
        const nombreMes = fechaPedido.toLocaleString('es-CO', { month: 'short' });
        const totalPedido = Number(pedido.total) || 0;

        ventasPorMes[nombreMes] = (ventasPorMes[nombreMes] || 0) + totalPedido;
      });

      // Transformar a formato para gráficos
      return Object.entries(ventasPorMes).map(([mes, total]) => ({
        mes,
        total
      }));
    } catch (error) {
      console.error('[storeService] Error en obtenerIngresosMensuales:', error);
      return []; // Retornar array vacío en caso de error para no romper gráficos
    }
  },

  /** Alias para compatibilidad */
  async getMonthlyIncome(storeId) {
    return this.obtenerIngresosMensuales(storeId);
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PRODUCTOS
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todos los productos de una tienda.
   * Ordenados por fecha de creación (más recientes primero).
   * 
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array>} Lista de productos
   * 
   * @example
   * const productos = await storeService.obtenerProductos('uuid-tienda');
   */
  async obtenerProductos(idTienda) {
    validarId(idTienda, 'ID de la tienda');

    try {
      const { data: listaProductos, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', idTienda)
        .order('created_at', { ascending: false });

      if (error) {
        manejarErrorSupabase(error, ERROR_PRODUCTOS_NO_CARGADOS);
      }

      if (error) {
        manejarErrorSupabase(error, ERROR_PRODUCTOS_NO_CARGADOS);
      }

      // Parse variants for all products (harmless for non-clothing)
      return (listaProductos || []).map(parseVariants);
    } catch (error) {
      manejarErrorSupabase(error, ERROR_PRODUCTOS_NO_CARGADOS);
    }
  },

  /** Alias para compatibilidad */
  async getProducts(storeId) {
    return this.obtenerProductos(storeId);
  },

  /**
   * Crea un nuevo producto para una tienda.
   * 
   * @param {Object} datosProducto - Datos del nuevo producto
   * @param {string} datosProducto.store_id - ID de la tienda
   * @param {string} datosProducto.name - Nombre del producto
   * @param {number} datosProducto.price - Precio del producto
   * @param {string} [datosProducto.description] - Descripción opcional
   * @param {string} [datosProducto.image_url] - URL de la imagen
   * @returns {Promise<Object>} Producto creado
   * 
   * @example
   * const nuevoProducto = await storeService.crearProducto({
   *   store_id: 'uuid-tienda',
   *   name: 'Hamburguesa Especial',
   *   price: 25000,
   *   description: 'Deliciosa hamburguesa con ingredientes premium'
   * });
   */
  async crearProducto(datosProducto) {
    if (!datosProducto || !datosProducto.store_id) {
      throw new Error('Los datos del producto son requeridos');
    }

    // Handle Variants (Clothing)
    const { variants, description, ...fields } = datosProducto;
    let finalDescription = description || '';
    let totalStock = fields.stock;

    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsJson = JSON.stringify(variants);
      finalDescription = `${description || ''}\n\nVARIANTS_JSON: ${variantsJson}`;
      totalStock = variants.reduce((sum, v) => sum + (Number(v.qty) || 0), 0);
    }

    try {
      const payload = {
        ...fields,
        description: finalDescription,
        stock: totalStock
      };

      const { data: productoCreado, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error) {
        manejarErrorSupabase(error, 'Error creando producto');
      }

      return parseVariants(productoCreado);
    } catch (error) {
      manejarErrorSupabase(error, 'Error creando producto');
    }
  },

  /**
   * Actualiza un producto existente.
   * 
   * @param {string} idProducto - UUID del producto a actualizar
   * @param {Object} actualizaciones - Campos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  async actualizarProducto(idProducto, actualizaciones) {
    validarId(idProducto, 'ID del producto');

    try {
      const { data: productoActualizado, error } = await supabase
        .from('products')
        .update(actualizaciones)
        .eq('id', idProducto)
        .select()
        .single();

      if (error) {
        manejarErrorSupabase(error, 'Error actualizando producto');
      }

      return productoActualizado;
    } catch (error) {
      manejarErrorSupabase(error, 'Error actualizando producto');
    }
  },

  /**
   * Elimina un producto de la tienda.
   * 
   * @param {string} idProducto - UUID del producto a eliminar
   * @returns {Promise<void>}
   */
  async eliminarProducto(idProducto) {
    validarId(idProducto, 'ID del producto');

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', idProducto);

      if (error) {
        manejarErrorSupabase(error, 'Error eliminando producto');
      }
    } catch (error) {
      manejarErrorSupabase(error, 'Error eliminando producto');
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PEDIDOS
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todos los pedidos de una tienda con información relacionada.
   * Incluye: cliente, items del pedido, productos, e información de entrega.
   * 
   * @param {string} idTienda - UUID de la tienda
   * @returns {Promise<Array>} Lista de pedidos con relaciones
   * 
   * @example
   * const pedidos = await storeService.obtenerPedidos('uuid-tienda');
   * pedidos.forEach(p => console.log(p.profiles.full_name, p.total));
   */
  async obtenerPedidos(idTienda) {
    validarId(idTienda, 'ID de la tienda');

    try {
      const { data: listaPedidos, error } = await supabase
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
        manejarErrorSupabase(error, ERROR_PEDIDOS_NO_CARGADOS);
      }

      return listaPedidos || [];
    } catch (error) {
      manejarErrorSupabase(error, ERROR_PEDIDOS_NO_CARGADOS);
    }
  },

  /** Alias para compatibilidad */
  async getOrders(storeId) {
    return this.obtenerPedidos(storeId);
  },

  /**
   * Actualiza el estado de un pedido.
   * 
   * Estados válidos: 'Pendiente', 'Confirmado', 'En preparación', 
   *                  'Listo para recogida', 'En curso', 'Entregado', 'Cancelado'
   * 
   * @param {string} idPedido - UUID del pedido
   * @param {string} nuevoEstado - Nuevo estado del pedido
   * @returns {Promise<Object>} Pedido actualizado
   * 
   * @example
   * await storeService.actualizarEstadoPedido('uuid-pedido', 'En preparación');
   */
  async actualizarEstadoPedido(idPedido, nuevoEstado) {
    validarId(idPedido, 'ID del pedido');

    if (!nuevoEstado || typeof nuevoEstado !== 'string') {
      throw new Error('El estado del pedido es requerido');
    }

    try {
      const { data: pedidoActualizado, error } = await supabase
        .from('orders')
        .update({ status: nuevoEstado })
        .eq('id', idPedido)
        .select()
        .single();

      if (error) {
        manejarErrorSupabase(error, 'Error actualizando estado del pedido');
      }

      return pedidoActualizado;
    } catch (error) {
      manejarErrorSupabase(error, 'Error actualizando estado del pedido');
    }
  },

  /** Alias para compatibilidad */
  async updateOrderStatus(orderId, status) {
    return this.actualizarEstadoPedido(orderId, status);
  },

  /**
   * Elimina un pedido. (Solo si no tiene restricciones de FK que lo impidan, o si es cascada)
   * @param {string} idPedido
   */
  async eliminarPedido(idPedido) {
    validarId(idPedido, 'ID del pedido');
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', idPedido);

      if (error) {
        manejarErrorSupabase(error, 'Error eliminando pedido');
      }
    } catch (error) {
      manejarErrorSupabase(error, 'Error eliminando pedido');
    }
  },

  /** Alias para compatibilidad */
  async deleteOrder(orderId) {
    return this.eliminarPedido(orderId);
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE MANTENIMIENTO (EQUIPOS)
  // ---------------------------------------------------------------------------

  async getEquipment(storeId) {
    validarId(storeId, 'ID de la tienda');
    try {
      const { data, error } = await supabase
        .from('store_equipment')
        .select('*')
        .eq('store_id', storeId)
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[storeService] Error cargando equipos:', e);
      return [];
    }
  },

  async addEquipment(equipmentData) {
    try {
      const { data, error } = await supabase.from('store_equipment').insert(equipmentData).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[storeService] Error agregando equipo:', e);
      throw e;
    }
  },

  async updateEquipment(id, equipmentData) {
    try {
      const { data, error } = await supabase.from('store_equipment').update(equipmentData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[storeService] Error actualizando equipo:', e);
      throw e;
    }
  },

  async deleteEquipment(id) {
    try {
      const { error } = await supabase.from('store_equipment').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('[storeService] Error eliminando equipo:', e);
      throw e;
    }
  },

  async getMaintenanceLogs(equipmentId) {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[storeService] Error cargando bitácora:', e);
      return [];
    }
  },

  async addMaintenanceLog(logData) {
    try {
      // 1. Insert Log
      const { data, error } = await supabase.from('maintenance_logs').insert(logData).select().single();
      if (error) throw error;

      // 2. Update Equipment "Last Service" if needed (Optional, or handled by trigger. For now manual or just UI calculation).
      // However, if we want to auto-update 'next_maintenance_date' based on type, we could do it here. 
      // For simplicity, we just save the log.

      return data;
    } catch (e) {
      console.error('[storeService] Error agregando bitácora:', e);
      throw e;
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES ESPECÍFICAS (RESTAURANT TABLES)
  // ---------------------------------------------------------------------------

  async getTables(storeId) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('store_id', storeId)
      .order('number');
    if (error) throw error;
    return data;
  },

  async createTable(tableData) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert(tableData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTableStatus(tableId, status) {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ status })
      .eq('id', tableId);
    if (error) throw error;
  },

  // Optimized POS Transaction (Moved from restaurantService)
  async createPOSTransaction({ orderPayload, items }) {
    // 1. Create Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create Order Items
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.qty,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating items", itemsError);
      // Optional: Delete order if items fail?
      throw itemsError;
    }

    return orderData;
  }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default storeService;
