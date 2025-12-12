/**
 * =============================================================================
 * SERVICIO DE CLIENTE (customerService.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las operaciones de base de datos relacionadas
 *   con los clientes/consumidores de la plataforma MiOriente.
 * 
 * Responsabilidades:
 *   - Obtener el perfil del cliente
 *   - Gestionar pedidos del cliente (activos e historial)
 *   - Gestionar direcciones de entrega
 *   - Obtener favoritos y preferencias
 * 
 * Uso:
 *   import { customerService } from '@/services/customerService';
 *   const perfil = await customerService.obtenerPerfil(userId);
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

/** Estados que indican que un pedido está activo (no finalizado) */
const ESTADOS_PEDIDO_ACTIVO = [
  'Pendiente',
  'Pendiente de pago en efectivo',
  'Confirmado',
  'En preparación',
  'Listo para recogida',
  'En curso'
];

/** Estados que indican que un pedido está finalizado */
const ESTADOS_PEDIDO_FINALIZADO = ['Entregado', 'Cancelado'];

/** Mensajes de error */
const ERRORES = {
  PERFIL_NO_ENCONTRADO: 'No se pudo encontrar el perfil del usuario',
  PEDIDOS_NO_CARGADOS: 'No se pudieron cargar los pedidos',
  DIRECCIONES_NO_CARGADAS: 'No se pudieron cargar las direcciones'
};

// =============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Valida que un ID de usuario sea válido.
 * 
 * @param {string} idUsuario - ID a validar
 * @throws {Error} Si el ID es inválido
 */
function validarIdUsuario(idUsuario) {
  if (!idUsuario || typeof idUsuario !== 'string' || idUsuario.trim() === '') {
    throw new Error('ID de usuario es requerido y debe ser válido');
  }
}

/**
 * Maneja errores de Supabase y los transforma en mensajes amigables.
 * 
 * @param {Error} error - Error original
 * @param {string} contexto - Mensaje de contexto
 */
function manejarError(error, contexto) {
  console.error(`[customerService] ${contexto}:`, error);
  throw new Error(error.message || contexto);
}

// =============================================================================
// SERVICIO PRINCIPAL DE CLIENTE
// =============================================================================

export const customerService = {

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PERFIL
  // ---------------------------------------------------------------------------

  /**
   * Obtiene el perfil completo de un cliente.
   * 
   * @param {string} idUsuario - UUID del usuario
   * @returns {Promise<Object>} Datos del perfil
   * @throws {Error} Si el perfil no existe o hay error de conexión
   * 
   * @example
   * const perfil = await customerService.obtenerPerfil('uuid-usuario');
   * console.log(perfil.full_name); // "Juan Pérez"
   */
  async obtenerPerfil(idUsuario) {
    validarIdUsuario(idUsuario);

    try {
      const { data: perfilCliente, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', idUsuario)
        .single();

      if (error) {
        manejarError(error, ERRORES.PERFIL_NO_ENCONTRADO);
      }

      return perfilCliente;
    } catch (error) {
      manejarError(error, ERRORES.PERFIL_NO_ENCONTRADO);
    }
  },

  /** Alias para compatibilidad */
  async getProfile(userId) {
    return this.obtenerPerfil(userId);
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE PEDIDOS
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todos los pedidos de un cliente con información relacionada.
   * Incluye: tienda, estado de entrega, items y productos.
   * 
   * @param {string} idUsuario - UUID del cliente
   * @returns {Promise<Array>} Lista de pedidos ordenados por fecha
   * 
   * @example
   * const pedidos = await customerService.obtenerPedidos('uuid-usuario');
   * pedidos.forEach(p => console.log(p.stores.name, p.total));
   */
  async obtenerPedidos(idUsuario) {
    validarIdUsuario(idUsuario);

    try {
      const { data: listaPedidos, error } = await supabase
        .from('orders')
        .select(`
          *, 
          stores (name, address, phone, image_url), 
          deliveries (status, delivery_person_id, profiles(full_name, phone)), 
          order_items (*, products!order_items_product_id_fkey(name, image_url, price))
        `)
        .eq('customer_id', idUsuario)
        .order('created_at', { ascending: false });

      if (error) {
        manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
      }

      return listaPedidos || [];
    } catch (error) {
      manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
    }
  },

  /** Alias para compatibilidad */
  async getOrders(userId) {
    return this.obtenerPedidos(userId);
  },

  /**
   * Obtiene solo los pedidos activos (no finalizados) de un cliente.
   * Pedidos activos: Pendiente, Confirmado, En preparación, En curso, etc.
   * 
   * @param {string} idUsuario - UUID del cliente
   * @returns {Promise<Array>} Lista de pedidos activos
   * 
   * @example
   * const activos = await customerService.obtenerPedidosActivos('uuid-usuario');
   * console.log(`Tienes ${activos.length} pedidos en proceso`);
   */
  async obtenerPedidosActivos(idUsuario) {
    validarIdUsuario(idUsuario);

    try {
      const { data: pedidosActivos, error } = await supabase
        .from('orders')
        .select(`
          *, 
          stores (name, address, phone, image_url), 
          deliveries (status, delivery_person_id, profiles(full_name, phone)), 
          order_items (*, products!order_items_product_id_fkey(name, image_url))
        `)
        .eq('customer_id', idUsuario)
        .in('status', ESTADOS_PEDIDO_ACTIVO)
        .order('created_at', { ascending: false });

      if (error) {
        manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
      }

      return pedidosActivos || [];
    } catch (error) {
      manejarError(error, ERRORES.PEDIDOS_NO_CARGADOS);
    }
  },

  /** Alias para compatibilidad - usado en useClientStore */
  async getActiveOrders(userId) {
    return this.obtenerPedidosActivos(userId);
  },

  /**
   * Obtiene el historial de pedidos finalizados (entregados o cancelados).
   * 
   * @param {string} idUsuario - UUID del cliente
   * @param {number} [limite=20] - Número máximo de pedidos a retornar
   * @returns {Promise<Array>} Lista de pedidos finalizados
   */
  async obtenerHistorialPedidos(idUsuario, limite = 20) {
    validarIdUsuario(idUsuario);

    try {
      const { data: historial, error } = await supabase
        .from('orders')
        .select(`
          *, 
          stores (name, image_url), 
          order_items (quantity, price, products!order_items_product_id_fkey(name))
        `)
        .eq('customer_id', idUsuario)
        .in('status', ESTADOS_PEDIDO_FINALIZADO)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) {
        manejarError(error, 'Error obteniendo historial');
      }

      return historial || [];
    } catch (error) {
      manejarError(error, 'Error obteniendo historial');
    }
  },

  /**
   * Obtiene los detalles de un pedido específico.
   * 
   * @param {string} idPedido - UUID del pedido
   * @returns {Promise<Object>} Detalles completos del pedido
   */
  async obtenerDetallePedido(idPedido) {
    if (!idPedido) {
      throw new Error('ID del pedido es requerido');
    }

    try {
      const { data: pedido, error } = await supabase
        .from('orders')
        .select(`
          *, 
          stores (name, address, phone, image_url),
          profiles (full_name, phone, email),
          deliveries (*, profiles(full_name, phone)),
          order_items (*, products!order_items_product_id_fkey(*))
        `)
        .eq('id', idPedido)
        .single();

      if (error) {
        manejarError(error, 'Pedido no encontrado');
      }

      return pedido;
    } catch (error) {
      manejarError(error, 'Error obteniendo detalles del pedido');
    }
  },

  // ---------------------------------------------------------------------------
  // OPERACIONES DE DIRECCIONES
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todas las direcciones guardadas de un cliente.
   * 
   * @param {string} idUsuario - UUID del cliente
   * @returns {Promise<Array>} Lista de direcciones
   * 
   * @example
   * const direcciones = await customerService.obtenerDirecciones('uuid-usuario');
   * const principal = direcciones.find(d => d.is_default);
   */
  async obtenerDirecciones(idUsuario) {
    validarIdUsuario(idUsuario);

    try {
      const { data: direcciones, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', idUsuario)
        .order('is_default', { ascending: false });

      if (error) {
        manejarError(error, ERRORES.DIRECCIONES_NO_CARGADAS);
      }

      return direcciones || [];
    } catch (error) {
      // No lanzar error, retornar array vacío
      console.error('[customerService] Error obteniendo direcciones:', error);
      return [];
    }
  },

  /**
   * Agrega una nueva dirección para el cliente.
   * 
   * @param {string} idUsuario - UUID del cliente
   * @param {Object} datosDireccion - Información de la dirección
   * @param {string} datosDireccion.address - Dirección completa
   * @param {string} [datosDireccion.label] - Etiqueta (Casa, Trabajo, etc.)
   * @param {boolean} [datosDireccion.is_default] - Si es la dirección principal
   * @param {number} [datosDireccion.lat] - Latitud
   * @param {number} [datosDireccion.lng] - Longitud
   * @returns {Promise<Object>} Dirección creada
   */
  async agregarDireccion(idUsuario, datosDireccion) {
    validarIdUsuario(idUsuario);

    if (!datosDireccion || !datosDireccion.address) {
      throw new Error('La dirección es requerida');
    }

    try {
      const { data: nuevaDireccion, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: idUsuario,
          ...datosDireccion
        })
        .select()
        .single();

      if (error) {
        manejarError(error, 'Error guardando dirección');
      }

      return nuevaDireccion;
    } catch (error) {
      manejarError(error, 'Error guardando dirección');
    }
  },

  /**
   * Elimina una dirección del cliente.
   * 
   * @param {string} idDireccion - UUID de la dirección a eliminar
   * @returns {Promise<void>}
   */
  async eliminarDireccion(idDireccion) {
    if (!idDireccion) {
      throw new Error('ID de dirección es requerido');
    }

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', idDireccion);

      if (error) {
        manejarError(error, 'Error eliminando dirección');
      }
    } catch (error) {
      manejarError(error, 'Error eliminando dirección');
    }
  }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default customerService;
