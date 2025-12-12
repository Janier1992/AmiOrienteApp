/**
 * =============================================================================
 * SERVICIO DE PEDIDOS (orderService.js)
 * =============================================================================
 * 
 * Descripción:
 *   Este módulo centraliza todas las operaciones relacionadas con pedidos
 *   que son compartidas entre diferentes roles (cliente, tienda, domiciliario).
 *   Evita duplicación de lógica entre stores y componentes.
 * 
 * Responsabilidades:
 *   - Crear nuevos pedidos
 *   - Actualizar estados de pedidos
 *   - Obtener detalles de pedidos
 *   - Calcular totales y comisiones
 *   - Gestionar items de pedidos
 * 
 * Estados de un Pedido:
 *   1. Pendiente → Pedido creado, esperando confirmación
 *   2. Pendiente de pago en efectivo → Pago al recibir
 *   3. Confirmado → Tienda aceptó el pedido
 *   4. En preparación → Tienda preparando el pedido
 *   5. Listo para recogida → Esperando domiciliario
 *   6. En curso → Domiciliario en camino
 *   7. Entregado → Pedido completado
 *   8. Cancelado → Pedido cancelado
 * 
 * Uso:
 *   import { orderService } from '@/services/orderService';
 *   const pedido = await orderService.crearPedido(datosPedido);
 * 
 * Dependencias:
 *   - Supabase Client (@/lib/customSupabaseClient)
 *   - Constants (@/lib/constants)
 * 
 * Autor: Equipo MiOriente
 * Última actualización: 2025-12-11
 * =============================================================================
 */

import { supabase } from '@/lib/customSupabaseClient';
import { ORDER_STATUS, SERVICE_FEE, DELIVERY_BASE_FEE } from '@/lib/constants';

// =============================================================================
// CONSTANTES DEL MÓDULO
// =============================================================================

/** Transiciones de estado válidas */
const TRANSICIONES_VALIDAS = {
    'Pendiente': ['Confirmado', 'Cancelado'],
    'Pendiente de pago en efectivo': ['Confirmado', 'Cancelado'],
    'Confirmado': ['En preparación', 'Cancelado'],
    'En preparación': ['Listo para recogida', 'Cancelado'],
    'Listo para recogida': ['En curso'],
    'En curso': ['Entregado'],
    'Entregado': [],
    'Cancelado': []
};

/** Mensajes de error */
const ERRORES = {
    PEDIDO_NO_ENCONTRADO: 'No se encontró el pedido especificado',
    TRANSICION_INVALIDA: 'Transición de estado no permitida',
    DATOS_INCOMPLETOS: 'Faltan datos requeridos para crear el pedido',
    ERROR_CREACION: 'No se pudo crear el pedido'
};

// =============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// =============================================================================

/**
 * Valida que un ID sea válido.
 * 
 * @param {string} id - ID a validar
 * @param {string} nombreCampo - Nombre del campo
 * @throws {Error} Si el ID es inválido
 */
function validarId(id, nombreCampo = 'ID') {
    if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error(`${nombreCampo} es requerido y debe ser válido`);
    }
}

/**
 * Verifica si una transición de estado es válida.
 * 
 * @param {string} estadoActual - Estado actual del pedido
 * @param {string} nuevoEstado - Estado al que se quiere cambiar
 * @returns {boolean} True si la transición es válida
 */
function esTransicionValida(estadoActual, nuevoEstado) {
    const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual];
    return transicionesPermitidas && transicionesPermitidas.includes(nuevoEstado);
}

/**
 * Maneja errores de Supabase.
 * 
 * @param {Error} error - Error original
 * @param {string} contexto - Mensaje de contexto
 */
function manejarError(error, contexto) {
    console.error(`[orderService] ${contexto}:`, error);
    throw new Error(error.message || contexto);
}

// =============================================================================
// SERVICIO PRINCIPAL DE PEDIDOS
// =============================================================================

export const orderService = {

    // ---------------------------------------------------------------------------
    // CREACIÓN DE PEDIDOS
    // ---------------------------------------------------------------------------

    /**
     * Crea un nuevo pedido con sus items.
     * 
     * @param {Object} datosPedido - Datos del pedido
     * @param {string} datosPedido.customer_id - UUID del cliente
     * @param {string} datosPedido.store_id - UUID de la tienda
     * @param {string} datosPedido.delivery_address - Dirección de entrega
     * @param {number} [datosPedido.delivery_lat] - Latitud de entrega
     * @param {number} [datosPedido.delivery_lng] - Longitud de entrega
     * @param {string} [datosPedido.payment_method] - Método de pago
     * @param {string} [datosPedido.notes] - Notas adicionales
     * @param {Array} items - Array de items del pedido
     * @param {string} items[].product_id - UUID del producto
     * @param {number} items[].quantity - Cantidad
     * @param {number} items[].price - Precio unitario
     * @returns {Promise<Object>} Pedido creado con sus items
     * 
     * @example
     * const pedido = await orderService.crearPedido({
     *   customer_id: 'uuid-cliente',
     *   store_id: 'uuid-tienda',
     *   delivery_address: 'Calle 10 #20-30',
     *   payment_method: 'efectivo'
     * }, [
     *   { product_id: 'uuid-producto', quantity: 2, price: 15000 }
     * ]);
     */
    async crearPedido(datosPedido, items) {
        // Validaciones
        if (!datosPedido || !datosPedido.customer_id || !datosPedido.store_id) {
            throw new Error(ERRORES.DATOS_INCOMPLETOS);
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('El pedido debe tener al menos un producto');
        }
        if (!datosPedido.delivery_address) {
            throw new Error('La dirección de entrega es requerida');
        }

        try {
            // Calcular totales
            const subtotal = items.reduce((sum, item) => {
                return sum + (Number(item.price) * Number(item.quantity));
            }, 0);

            const tarifaServicio = SERVICE_FEE;
            const tarifaEnvio = DELIVERY_BASE_FEE;
            const total = subtotal + tarifaServicio + tarifaEnvio;

            // Determinar estado inicial según método de pago
            const estadoInicial = datosPedido.payment_method === 'efectivo'
                ? 'Pendiente de pago en efectivo'
                : 'Pendiente';

            // Crear el pedido
            const { data: nuevoPedido, error: errorPedido } = await supabase
                .from('orders')
                .insert({
                    customer_id: datosPedido.customer_id,
                    store_id: datosPedido.store_id,
                    delivery_address: datosPedido.delivery_address,
                    delivery_lat: datosPedido.delivery_lat,
                    delivery_lng: datosPedido.delivery_lng,
                    payment_method: datosPedido.payment_method || 'efectivo',
                    notes: datosPedido.notes,
                    subtotal,
                    service_fee: tarifaServicio,
                    delivery_fee: tarifaEnvio,
                    total,
                    status: estadoInicial
                })
                .select()
                .single();

            if (errorPedido) {
                manejarError(errorPedido, ERRORES.ERROR_CREACION);
            }

            // Crear los items del pedido
            const itemsConPedidoId = items.map(item => ({
                order_id: nuevoPedido.id,
                product_id: item.product_id,
                quantity: Number(item.quantity),
                price: Number(item.price)
            }));

            const { error: errorItems } = await supabase
                .from('order_items')
                .insert(itemsConPedidoId);

            if (errorItems) {
                // Rollback: eliminar el pedido si falló la creación de items
                await supabase.from('orders').delete().eq('id', nuevoPedido.id);
                manejarError(errorItems, 'Error creando items del pedido');
            }

            return nuevoPedido;
        } catch (error) {
            manejarError(error, ERRORES.ERROR_CREACION);
        }
    },

    // ---------------------------------------------------------------------------
    // OBTENER PEDIDOS
    // ---------------------------------------------------------------------------

    /**
     * Obtiene los detalles completos de un pedido por su ID.
     * 
     * @param {string} idPedido - UUID del pedido
     * @returns {Promise<Object>} Pedido con todas sus relaciones
     */
    async obtenerPedidoPorId(idPedido) {
        validarId(idPedido, 'ID del pedido');

        try {
            const { data: pedido, error } = await supabase
                .from('orders')
                .select(`
          *,
          stores (id, name, address, phone, image_url, lat, lng),
          profiles (id, full_name, phone, email),
          order_items (
            id, 
            quantity, 
            price,
            products!order_items_product_id_fkey (id, name, image_url, description)
          ),
          deliveries (
            id,
            status,
            delivery_person_id,
            assigned_at,
            picked_up_at,
            delivered_at,
            profiles (full_name, phone)
          )
        `)
                .eq('id', idPedido)
                .single();

            if (error) {
                manejarError(error, ERRORES.PEDIDO_NO_ENCONTRADO);
            }

            return pedido;
        } catch (error) {
            manejarError(error, ERRORES.PEDIDO_NO_ENCONTRADO);
        }
    },

    // ---------------------------------------------------------------------------
    // ACTUALIZACIÓN DE ESTADOS
    // ---------------------------------------------------------------------------

    /**
     * Actualiza el estado de un pedido con validación de transiciones.
     * 
     * @param {string} idPedido - UUID del pedido
     * @param {string} nuevoEstado - Nuevo estado del pedido
     * @param {boolean} [forzar=false] - Si true, omite validación de transición
     * @returns {Promise<Object>} Pedido actualizado
     * 
     * @example
     * // Tienda confirma pedido
     * await orderService.actualizarEstado('uuid-pedido', 'Confirmado');
     * 
     * // Forzar cambio a cancelado (para admins)
     * await orderService.actualizarEstado('uuid-pedido', 'Cancelado', true);
     */
    async actualizarEstado(idPedido, nuevoEstado, forzar = false) {
        validarId(idPedido, 'ID del pedido');

        if (!nuevoEstado) {
            throw new Error('El nuevo estado es requerido');
        }

        try {
            // Obtener estado actual
            const { data: pedidoActual, error: errorConsulta } = await supabase
                .from('orders')
                .select('status')
                .eq('id', idPedido)
                .single();

            if (errorConsulta) {
                manejarError(errorConsulta, ERRORES.PEDIDO_NO_ENCONTRADO);
            }

            // Validar transición
            if (!forzar && !esTransicionValida(pedidoActual.status, nuevoEstado)) {
                throw new Error(
                    `${ERRORES.TRANSICION_INVALIDA}: No se puede cambiar de "${pedidoActual.status}" a "${nuevoEstado}"`
                );
            }

            // Actualizar estado
            const { data: pedidoActualizado, error: errorUpdate } = await supabase
                .from('orders')
                .update({
                    status: nuevoEstado,
                    updated_at: new Date().toISOString()
                })
                .eq('id', idPedido)
                .select()
                .single();

            if (errorUpdate) {
                manejarError(errorUpdate, 'Error actualizando estado');
            }

            return pedidoActualizado;
        } catch (error) {
            manejarError(error, 'Error actualizando estado del pedido');
        }
    },

    /**
     * Cancela un pedido si es posible.
     * Solo se pueden cancelar pedidos que no estén en curso o entregados.
     * 
     * @param {string} idPedido - UUID del pedido
     * @param {string} [motivo] - Motivo de la cancelación
     * @returns {Promise<Object>} Pedido cancelado
     */
    async cancelarPedido(idPedido, motivo = null) {
        validarId(idPedido, 'ID del pedido');

        try {
            // Verificar estado actual
            const { data: pedido, error: errorConsulta } = await supabase
                .from('orders')
                .select('status')
                .eq('id', idPedido)
                .single();

            if (errorConsulta) {
                manejarError(errorConsulta, ERRORES.PEDIDO_NO_ENCONTRADO);
            }

            const estadosNoCancelables = ['En curso', 'Entregado', 'Cancelado'];
            if (estadosNoCancelables.includes(pedido.status)) {
                throw new Error(`No se puede cancelar un pedido en estado "${pedido.status}"`);
            }

            // Cancelar
            const { data: pedidoCancelado, error: errorUpdate } = await supabase
                .from('orders')
                .update({
                    status: 'Cancelado',
                    cancellation_reason: motivo,
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', idPedido)
                .select()
                .single();

            if (errorUpdate) {
                manejarError(errorUpdate, 'Error cancelando pedido');
            }

            return pedidoCancelado;
        } catch (error) {
            manejarError(error, 'Error al cancelar el pedido');
        }
    },

    // ---------------------------------------------------------------------------
    // CÁLCULOS Y UTILIDADES
    // ---------------------------------------------------------------------------

    /**
     * Calcula el total de un pedido dado sus items.
     * 
     * @param {Array} items - Items del pedido
     * @param {boolean} [incluirTarifas=true] - Si incluir tarifas de servicio y envío
     * @returns {{subtotal: number, tarifaServicio: number, tarifaEnvio: number, total: number}}
     * 
     * @example
     * const totales = orderService.calcularTotal([
     *   { price: 15000, quantity: 2 },
     *   { price: 8000, quantity: 1 }
     * ]);
     * console.log(totales.total); // 38000 + tarifas
     */
    calcularTotal(items, incluirTarifas = true) {
        if (!items || !Array.isArray(items)) {
            return { subtotal: 0, tarifaServicio: 0, tarifaEnvio: 0, total: 0 };
        }

        const subtotal = items.reduce((sum, item) => {
            const precio = Number(item.price) || 0;
            const cantidad = Number(item.quantity) || 0;
            return sum + (precio * cantidad);
        }, 0);

        const tarifaServicio = incluirTarifas ? SERVICE_FEE : 0;
        const tarifaEnvio = incluirTarifas ? DELIVERY_BASE_FEE : 0;
        const total = subtotal + tarifaServicio + tarifaEnvio;

        return {
            subtotal,
            tarifaServicio,
            tarifaEnvio,
            total
        };
    },

    /**
     * Verifica si un pedido puede ser cancelado.
     * 
     * @param {string} estadoPedido - Estado actual del pedido
     * @returns {boolean} True si se puede cancelar
     */
    sePuedeCancelar(estadoPedido) {
        const estadosNoCancelables = ['En curso', 'Entregado', 'Cancelado'];
        return !estadosNoCancelables.includes(estadoPedido);
    },

    /**
     * Obtiene las transiciones de estado disponibles para un pedido.
     * 
     * @param {string} estadoActual - Estado actual del pedido
     * @returns {Array<string>} Lista de estados disponibles
     */
    obtenerTransicionesDisponibles(estadoActual) {
        return TRANSICIONES_VALIDAS[estadoActual] || [];
    }
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================

export default orderService;
