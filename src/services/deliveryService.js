/**
 * =============================================================================
 * SERVICIO DE DOMICILIARIO (deliveryService.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las operaciones de base de datos relacionadas
 *   con los domiciliarios/repartidores de la plataforma MiOriente.
 * 
 * Responsabilidades:
 *   - Obtener pedidos disponibles para entrega
 *   - Gestionar entregas activas
 *   - Actualizar ubicación del domiciliario
 *   - Registrar ganancias y estadísticas
 * 
 * Flujo de una entrega:
 *   1. Domiciliario ve pedido "Listo para recoger"
 *   2. Acepta la entrega → Estado: "Asignado"
 *   3. Recoge el pedido → Estado: "Recogido"
 *   4. Entrega al cliente → Estado: "Entregado"
 * 
 * Uso:
 *   import { deliveryService } from '@/services/deliveryService';
 *   const disponibles = await deliveryService.obtenerPedidosDisponibles();
 * 
 * Dependencias:
 *   - Supabase Client (@/lib/customSupabaseClient)
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';

// =============================================================================
// CONSTANTES DEL MÓDULO
// =============================================================================

/** Estados de pedido elegibles para asignar a un domiciliario */
const ESTADOS_DISPONIBLES_PARA_ENTREGA = [
  'Listo para recogida',
  'Pendiente',           // Algunos pedidos pueden requerir recogida inmediata
  'Pendiente de pago en efectivo'
];

/** Estados de entrega */
const ESTADOS_ENTREGA = {
  BUSCANDO: 'Buscando',
  ASIGNADO: 'Asignado',
  RECOGIDO: 'Recogido',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado'
};

/** Mensajes de error */
const ERRORES = {
  PEDIDOS_NO_CARGADOS: 'No se pudieron cargar los pedidos disponibles',
  ENTREGA_NO_ENCONTRADA: 'No se encontró la entrega especificada',
  ERROR_ACTUALIZACION: 'No se pudo actualizar el estado de la entrega'
};

// =============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Valida que un ID sea válido.
 * 
 * @param {string} id - ID a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje
 * @throws {Error} Si el ID es inválido
 */
function validarId(id, nombreCampo = 'ID') {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`${nombreCampo} es requerido y debe ser válido`);
  }
}

/**
 * Maneja errores y los registra en consola.
 * 
 * @param {Error} error - Error original
 * @param {string} contexto - Mensaje de contexto
 */
function manejarError(error, contexto) {
  console.error(`[deliveryService] ${contexto}:`, error);
  throw new Error(error.message || contexto);
}

// =============================================================================
// SERVICIO PRINCIPAL DE DOMICILIARIO
// =============================================================================

export const deliveryService = {

  // ---------------------------------------------------------------------------
  // PEDIDOS DISPONIBLES
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todos los pedidos disponibles para ser asignados a un domiciliario.
   * Filtra pedidos que aún no tienen domiciliario asignado.
   * 
   * @returns {Promise<Array>} Lista de pedidos disponibles para entrega
   * 
   * @example
   * const disponibles = await deliveryService.obtenerPedidosDisponibles();
   * console.log(`Hay ${disponibles.length} pedidos esperando`);
   */
  async obtenerPedidosDisponibles() {
    try {
      // Primero obtenemos pedidos que están listos
      const { data: pedidosListos, error } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          total, 
          status, 
          delivery_address,
          delivery_lat,
          delivery_lng,
          stores (id, name, address, contact_phone),
          profiles (full_name, phone)
        `)
        .in('status', ESTADOS_DISPONIBLES_PARA_ENTREGA)
        .order('created_at', { ascending: false });

      if (error) {
        manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
      }

      // Filtrar pedidos que ya tienen una entrega asignada
      // Esto se haría idealmente con una subconsulta, pero por simplicidad:
      const pedidosSinAsignar = [];

      for (const pedido of (pedidosListos || [])) {
        const { data: entrega } = await supabase
          .from('deliveries')
          .select('id')
          .eq('order_id', pedido.id)
          .in('status', [ESTADOS_ENTREGA.ASIGNADO, ESTADOS_ENTREGA.RECOGIDO, ESTADOS_ENTREGA.EN_CAMINO])
          .maybeSingle();

        // Si no tiene entrega activa, está disponible
        if (!entrega) {
          pedidosSinAsignar.push(pedido);
        }
      }

      return pedidosSinAsignar;
    } catch (error) {
      manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
    }
  },

  /** Alias para compatibilidad - usado en useDeliveryStore */
  async getAvailableDeliveries() {
    return this.obtenerPedidosDisponibles();
  },

  /** Alias alternativo */
  async getAvailableOrders() {
    return this.obtenerPedidosDisponibles();
  },

  // ---------------------------------------------------------------------------
  // ENTREGA ACTUAL
  // ---------------------------------------------------------------------------

  /**
   * Obtiene la entrega activa del domiciliario (si tiene una).
   * Un domiciliario solo puede tener una entrega activa a la vez.
   * 
   * @param {string} idDomiciliario - UUID del domiciliario
   * @returns {Promise<Object|null>} Datos de la entrega activa o null
   * 
   * @example
   * const entregaActiva = await deliveryService.obtenerEntregaActual('uuid-domiciliario');
   * if (entregaActiva) {
   *   console.log('Tienes una entrega en curso');
   * }
   */
  async obtenerEntregaActual(idDomiciliario) {
    validarId(idDomiciliario, 'ID del domiciliario');

    try {
      const { data: entregaActiva, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            id, 
            total, 
            status, 
            delivery_address,
            delivery_lat,
            delivery_lng,
            created_at,
            stores (name, address, contact_phone),
            profiles (full_name, phone),
            order_items (quantity, products!order_items_product_id_fkey(name))
          )
        `)
        .eq('delivery_person_id', idDomiciliario)
        .in('status', [ESTADOS_ENTREGA.ASIGNADO, ESTADOS_ENTREGA.RECOGIDO, ESTADOS_ENTREGA.EN_CAMINO])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('[deliveryService] Error obteniendo entrega actual:', error);
        return null;
      }

      return entregaActiva;
    } catch (error) {
      console.error('[deliveryService] Error inesperado:', error);
      return null;
    }
  },

  /** Alias para compatibilidad */
  async getCurrentDelivery(userId) {
    return this.obtenerEntregaActual(userId);
  },

  // ---------------------------------------------------------------------------
  // GESTIÓN DE ENTREGAS
  // ---------------------------------------------------------------------------

  /**
   * Acepta un pedido para entrega. Crea un registro en la tabla 'deliveries'.
   * 
   * @param {string} idPedido - UUID del pedido a aceptar
   * @param {string} idDomiciliario - UUID del domiciliario
   * @returns {Promise<Object>} Registro de entrega creado
   * 
   * @example
   * await deliveryService.aceptarEntrega('uuid-pedido', 'uuid-domiciliario');
   * // El pedido ahora está asignado a este domiciliario
   */
  async aceptarEntrega(idPedido, idDomiciliario) {
    validarId(idPedido, 'ID del pedido');
    validarId(idDomiciliario, 'ID del domiciliario');

    try {
      // Verificar que el pedido no esté ya asignado
      const { data: entregaExistente } = await supabase
        .from('deliveries')
        .select('id')
        .eq('order_id', idPedido)
        .not('status', 'eq', ESTADOS_ENTREGA.ENTREGADO)
        .maybeSingle();

      if (entregaExistente) {
        throw new Error('Este pedido ya fue tomado por otro domiciliario');
      }

      // Crear registro de entrega
      const { data: nuevaEntrega, error } = await supabase
        .from('deliveries')
        .insert({
          order_id: idPedido,
          delivery_person_id: idDomiciliario,
          status: ESTADOS_ENTREGA.ASIGNADO,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // El índice único de la base de datos (ver database_updates/
        // 20261007_unique_active_delivery_per_order.sql) impide que dos
        // domiciliarios tomen el mismo pedido aunque acepten a la vez.
        if (error.code === '23505') {
          throw new Error('Este pedido ya fue tomado por otro domiciliario');
        }
        manejarError(error, 'Error al aceptar la entrega');
      }

      // Actualizar estado del pedido
      await supabase
        .from('orders')
        .update({ status: 'En curso' })
        .eq('id', idPedido);

      return nuevaEntrega;
    } catch (error) {
      manejarError(error, 'Error al aceptar la entrega');
    }
  },

  /** Alias para compatibilidad */
  async acceptDelivery(orderId, userId) {
    return this.aceptarEntrega(orderId, userId);
  },

  /**
   * Actualiza el estado de una entrega.
   * 
   * Estados válidos: 'Asignado', 'Recogido', 'En camino', 'Entregado'
   * 
   * @param {string} idPedido - UUID del pedido
   * @param {string} nuevoEstado - Nuevo estado de la entrega
   * @returns {Promise<Object>} Entrega actualizada
   * 
   * @example
   * // El domiciliario recogió el pedido de la tienda
   * await deliveryService.actualizarEstadoEntrega('uuid-pedido', 'Recogido');
   * 
   * // El domiciliario entregó al cliente
   * await deliveryService.actualizarEstadoEntrega('uuid-pedido', 'Entregado');
   */
  async actualizarEstadoEntrega(idPedido, nuevoEstado) {
    validarId(idPedido, 'ID del pedido');

    const estadosValidos = Object.values(ESTADOS_ENTREGA);
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    try {
      const actualizaciones = { status: nuevoEstado };

      // Si está entregado, registrar hora de entrega
      if (nuevoEstado === ESTADOS_ENTREGA.ENTREGADO) {
        actualizaciones.delivered_at = new Date().toISOString();
      }

      // Si está recogido, registrar hora de recogida
      if (nuevoEstado === ESTADOS_ENTREGA.RECOGIDO) {
        actualizaciones.picked_up_at = new Date().toISOString();
      }

      const { data: entregaActualizada, error } = await supabase
        .from('deliveries')
        .update(actualizaciones)
        .eq('order_id', idPedido)
        .select()
        .single();

      if (error) {
        manejarError(error, ERRORES.ERROR_ACTUALIZACION);
      }

      // Si se entregó, actualizar también el estado del pedido
      if (nuevoEstado === ESTADOS_ENTREGA.ENTREGADO) {
        await supabase
          .from('orders')
          .update({ status: 'Entregado' })
          .eq('id', idPedido);
      }

      return entregaActualizada;
    } catch (error) {
      manejarError(error, ERRORES.ERROR_ACTUALIZACION);
    }
  },

  /** Alias para compatibilidad */
  async updateDeliveryStatus(orderId, newStatus) {
    return this.actualizarEstadoEntrega(orderId, newStatus);
  },

  // ---------------------------------------------------------------------------
  // UBICACIÓN EN TIEMPO REAL
  // ---------------------------------------------------------------------------

  /**
   * Actualiza la ubicación del domiciliario en tiempo real.
   * Utiliza upsert para crear o actualizar según corresponda.
   * 
   * @param {string} idDomiciliario - UUID del domiciliario
   * @param {number} latitud - Coordenada de latitud
   * @param {number} longitud - Coordenada de longitud
   * @returns {Promise<void>}
   * 
   * @example
   * // Actualizar posición cada 30 segundos
   * navigator.geolocation.watchPosition((pos) => {
   *   deliveryService.actualizarUbicacion(userId, pos.coords.latitude, pos.coords.longitude);
   * });
   */
  async actualizarUbicacion(idDomiciliario, latitud, longitud) {
    validarId(idDomiciliario, 'ID del domiciliario');

    if (typeof latitud !== 'number' || typeof longitud !== 'number') {
      throw new Error('Latitud y longitud deben ser números válidos');
    }

    // Validar rango de coordenadas
    if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
      throw new Error('Coordenadas fuera de rango válido');
    }

    try {
      const { error } = await supabase
        .from('delivery_locations')
        .upsert({
          delivery_person_id: idDomiciliario,
          lat: latitud,
          lng: longitud,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'delivery_person_id'
        });

      if (error) {
        console.error('[deliveryService] Error actualizando ubicación:', error);
        // No lanzamos error para no interrumpir la experiencia del usuario
      }
    } catch (error) {
      console.error('[deliveryService] Error inesperado en ubicación:', error);
    }
  },

  /** Alias para compatibilidad */
  async updateLocation(userId, lat, lng) {
    return this.actualizarUbicacion(userId, lat, lng);
  },

  // ---------------------------------------------------------------------------
  // ESTADÍSTICAS Y GANANCIAS
  // ---------------------------------------------------------------------------

  /**
   * Obtiene las estadísticas de un domiciliario.
   * 
   * @param {string} idDomiciliario - UUID del domiciliario
   * @returns {Promise<Object>} Estadísticas del domiciliario
   */
  async obtenerEstadisticas(idDomiciliario) {
    validarId(idDomiciliario, 'ID del domiciliario');

    try {
      // Obtener entregas completadas junto con su liquidación real
      // (70% del delivery_fee de la orden, calculado por el trigger
      // handle_delivery_completed al marcar la entrega como 'Entregado').
      const { data: entregas, error } = await supabase
        .from('deliveries')
        .select('id, created_at, delivered_at, delivery_payouts(amount, status)')
        .eq('delivery_person_id', idDomiciliario)
        .eq('status', ESTADOS_ENTREGA.ENTREGADO);

      if (error) {
        console.error('[deliveryService] Error obteniendo estadísticas:', error);
        return { totalEntregas: 0, gananciaTotal: 0, gananciaPendiente: 0, gananciaPagada: 0 };
      }

      const totalEntregas = entregas?.length || 0;

      let gananciaTotal = 0;
      let gananciaPendiente = 0;
      let gananciaPagada = 0;

      for (const entrega of entregas || []) {
        const payout = Array.isArray(entrega.delivery_payouts)
          ? entrega.delivery_payouts[0]
          : entrega.delivery_payouts;
        const amount = Number(payout?.amount) || 0;
        gananciaTotal += amount;
        if (payout?.status === 'paid') {
          gananciaPagada += amount;
        } else {
          gananciaPendiente += amount;
        }
      }

      return {
        totalEntregas,
        gananciaTotal: Math.round(gananciaTotal),
        gananciaPendiente: Math.round(gananciaPendiente),
        gananciaPagada: Math.round(gananciaPagada)
      };
    } catch (error) {
      console.error('[deliveryService] Error:', error);
      return { totalEntregas: 0, gananciaTotal: 0, gananciaPendiente: 0, gananciaPagada: 0 };
    }
  },

  /**
   * Obtiene el historial de entregas del domiciliario.
   * 
   * @param {string} idDomiciliario - UUID del domiciliario
   * @param {number} [limite=20] - Número máximo de entregas
   * @returns {Promise<Array>} Historial de entregas
   */
  async obtenerHistorialEntregas(idDomiciliario, limite = 20) {
    validarId(idDomiciliario, 'ID del domiciliario');

    try {
      const { data: historial, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders (
            total,
            delivery_fee,
            delivery_address,
            stores (name)
          ),
          delivery_payouts (
            amount,
            status,
            paid_at
          )
        `)
        .eq('delivery_person_id', idDomiciliario)
        .eq('status', ESTADOS_ENTREGA.ENTREGADO)
        .order('delivered_at', { ascending: false })
        .limit(limite);

      if (error) {
        console.error('[deliveryService] Error:', error);
        return [];
      }

      return historial || [];
    } catch (error) {
      console.error('[deliveryService] Error:', error);
      return [];
    }
  },

  /**
   * Obtiene las liquidaciones de domicilio (pagadas y pendientes) de los
   * pedidos de una tienda, para que el dueño pueda ver cuánto le debe
   * a cada domiciliario y marcar lo que ya pagó.
   *
   * @param {string} storeId - UUID de la tienda
   * @returns {Promise<Array>} Liquidaciones con datos del domiciliario y el pedido
   */
  async obtenerLiquidacionesPorTienda(storeId) {
    validarId(storeId, 'ID de la tienda');

    try {
      const { data, error } = await supabase
        .from('delivery_payouts')
        .select(`
          id,
          amount,
          status,
          paid_at,
          created_at,
          deliveries (
            delivery_person_id,
            delivered_at,
            profiles:delivery_person_id (full_name, phone),
            orders (id, store_id, delivery_fee)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[deliveryService] Error obteniendo liquidaciones:', error);
        return [];
      }

      // Filtrar en cliente por tienda (el join anidado no permite filtrar
      // directamente por orders.store_id en este nivel de la consulta)
      return (data || []).filter(p => p.deliveries?.orders?.store_id === storeId);
    } catch (error) {
      console.error('[deliveryService] Error:', error);
      return [];
    }
  },

  /**
   * Marca una liquidación de domicilio como pagada.
   *
   * @param {string} payoutId - UUID del registro en delivery_payouts
   * @returns {Promise<Object>} Registro actualizado
   */
  async marcarLiquidacionPagada(payoutId) {
    validarId(payoutId, 'ID de la liquidación');

    try {
      const { data, error } = await supabase
        .from('delivery_payouts')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[deliveryService] Error marcando liquidación como pagada:', error);
      throw error;
    }
  }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default deliveryService;
