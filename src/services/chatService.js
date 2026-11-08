import { supabase } from '@/lib/customSupabaseClient';
import { crearManejadorDeErrores } from '@/lib/serviceError';

const manejarError = crearManejadorDeErrores('chatService');

const exigirId = (id) => {
  if (!id || typeof id !== 'string') throw new Error('El pedido es requerido');
};

/**
 * Chat interno cliente ↔ domiciliario de un pedido.
 *
 * Escribir, marcar como leído y reportar pasan por funciones del servidor que validan quién
 * participa y el estado del pedido; la tabla no admite escritura directa.
 */
export const chatService = {
  /** Mensajes del pedido, del más antiguo al más nuevo. */
  async obtenerMensajes(idPedido) {
    exigirId(idPedido);
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', idPedido)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) manejarError(error, 'No se pudieron cargar los mensajes');
    return data || [];
  },

  /** Envía un mensaje y devuelve el registro creado. */
  async enviarMensaje(idPedido, texto) {
    exigirId(idPedido);
    const { data, error } = await supabase.rpc('send_order_message', { p_order_id: idPedido, p_body: texto });
    if (error) manejarError(error, 'No se pudo enviar el mensaje');
    return data;
  },

  async marcarLeidos(idPedido) {
    exigirId(idPedido);
    const { error } = await supabase.rpc('mark_order_messages_read', { p_order_id: idPedido });
    if (error) manejarError(error, 'No se pudieron marcar los mensajes como leídos');
  },

  /** Avisa a la plataforma de un problema en la conversación; habilita su revisión. */
  async reportarConversacion(idPedido, motivo) {
    exigirId(idPedido);
    const { data, error } = await supabase.rpc('report_order_chat', { p_order_id: idPedido, p_reason: motivo });
    if (error) manejarError(error, 'No se pudo enviar el reporte');
    return data;
  },

  /** Recibe los mensajes nuevos en vivo. Devuelve la función que cancela la suscripción. */
  suscribirse(idPedido, alRecibir) {
    const canal = supabase
      .channel(`order-chat-${idPedido}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${idPedido}` },
        (payload) => alRecibir(payload.new),
      )
      .subscribe();
    return () => supabase.removeChannel(canal);
  },
};
