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
          stores (id, name, address, lat, lng, phone),
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
            stores (name, address, phone, lat, lng),
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
      // Obtener entregas completadas
      const { data: entregas, error } = await supabase
        .from('deliveries')
        .select('id, created_at, delivered_at, orders(total)')
        .eq('delivery_person_id', idDomiciliario)
        .eq('status', ESTADOS_ENTREGA.ENTREGADO);

      if (error) {
        console.error('[deliveryService] Error obteniendo estadísticas:', error);
        return { totalEntregas: 0, gananciaTotal: 0 };
      }

      const totalEntregas = entregas?.length || 0;

      // Calcular ganancias (ejemplo: 10% del total del pedido)
      const gananciaTotal = entregas?.reduce((sum, e) => {
        const totalPedido = Number(e.orders?.total) || 0;
        return sum + (totalPedido * 0.10); // 10% comisión
      }, 0) || 0;

      return {
        totalEntregas,
        gananciaTotal: Math.round(gananciaTotal)
      };
    } catch (error) {
      console.error('[deliveryService] Error:', error);
      return { totalEntregas: 0, gananciaTotal: 0 };
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
            delivery_address,
            stores (name)
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
  }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default deliveryService;
