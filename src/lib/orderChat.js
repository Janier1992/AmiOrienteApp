/**
 * Reglas del chat entre cliente y domiciliario de un pedido.
 *
 * El servidor es quien decide (ver `database_updates/20261015_order_chat.sql`); aquí viven
 * solo las constantes y funciones puras que la interfaz necesita para reflejarlas.
 */

export const MAX_CHAT_LENGTH = 500;

/** Días que se conserva la conversación después de cerrarse el pedido (Ley 1581). */
export const CHAT_RETENTION_DAYS = 30;

/** Solo se puede escribir mientras el pedido va en camino. */
export const chatEstaAbierto = (estadoPedido) => estadoPedido === 'En curso';

/** Mensajes de un toque, útiles con las manos ocupadas. */
export const RESPUESTAS_RAPIDAS = {
  domiciliario: ['Ya llegué', 'Estoy afuera', 'No encuentro la dirección', 'Voy en camino'],
  cliente: ['Ya bajo', 'Estoy en la portería', 'Déjalo con el portero', 'Gracias'],
};

/** Agrega un mensaje sin duplicarlo (llega por Realtime y por la consulta) y en orden. */
export const agregarMensaje = (lista, nuevo) => {
  if (!nuevo?.id || lista.some((m) => m.id === nuevo.id)) return lista;
  return [...lista, nuevo].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

/** Mensajes de la otra parte que el usuario aún no ha leído. */
export const contarNoLeidos = (mensajes, idUsuario) =>
  mensajes.filter((m) => m.sender_id !== idUsuario && !m.read_at).length;
