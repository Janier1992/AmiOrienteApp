/**
 * Reglas de estado de los pedidos que comparten la interfaz y las pruebas.
 * Las reglas definitivas viven en la base de datos (cancel_order, protect_orders_write);
 * esto solo decide qué botones mostrar.
 */

/** Pedidos nuevos que el negocio todavía no ha confirmado. */
export const NEW_ORDER_STATUSES = ['Nuevo', 'Pendiente', 'Pendiente de pago en efectivo'];

/** El cliente puede cancelar mientras el negocio no haya empezado a prepararlo. */
export const CUSTOMER_CANCELABLE_STATUSES = [...NEW_ORDER_STATUSES, 'Confirmado'];

/** El negocio puede cancelar hasta que el domiciliario recoge el pedido. */
export const STORE_CANCELABLE_STATUSES = [...CUSTOMER_CANCELABLE_STATUSES, 'En preparación', 'Listo para recogida'];

/** Estados finales: el pedido ya no está en curso. */
export const FINAL_STATUSES = ['Entregado', 'Cancelado'];

export const isActiveOrder = (order) => !FINAL_STATUSES.includes(order?.status);
export const isNewOrder = (order) => NEW_ORDER_STATUSES.includes(order?.status);
