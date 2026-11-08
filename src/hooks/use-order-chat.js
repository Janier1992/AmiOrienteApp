import { useCallback, useEffect, useMemo, useState } from 'react';
import { chatService } from '@/services/chatService';
import { agregarMensaje, contarNoLeidos } from '@/lib/orderChat';

/** Respaldo por si la conexión en vivo falla (mismo criterio que los avisos de pedidos). */
export const CHAT_POLL_MS = 20000;

/**
 * Estado del chat de un pedido: mensajes, no leídos y envío.
 * Usa Realtime y, por si falla, consulta cada 20 s mientras el pedido siga abierto.
 * Con `activo` en falso (chat archivado sin abrir) no consulta ni se suscribe.
 */
export const useOrderChat = ({ orderId, userId, abierto, activo = true }) => {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const recargar = useCallback(async () => {
    if (!orderId || !activo) return;
    try {
      const lista = await chatService.obtenerMensajes(orderId);
      setMensajes((previos) => lista.reduce(agregarMensaje, previos.length ? previos : []));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [orderId, activo]);

  useEffect(() => {
    if (!orderId || !activo) return undefined;
    recargar();
    const cancelar = chatService.suscribirse(orderId, (nuevo) => setMensajes((previos) => agregarMensaje(previos, nuevo)));
    const intervalo = abierto ? setInterval(recargar, CHAT_POLL_MS) : null;
    return () => {
      cancelar();
      if (intervalo) clearInterval(intervalo);
    };
  }, [orderId, activo, abierto, recargar]);

  const enviar = useCallback(async (texto) => {
    setEnviando(true);
    try {
      const creado = await chatService.enviarMensaje(orderId, texto);
      if (creado) setMensajes((previos) => agregarMensaje(previos, creado));
    } finally {
      setEnviando(false);
    }
  }, [orderId]);

  const marcarLeidos = useCallback(async () => {
    try {
      await chatService.marcarLeidos(orderId);
      const ahora = new Date().toISOString();
      setMensajes((previos) => previos.map((m) => (m.sender_id !== userId && !m.read_at ? { ...m, read_at: ahora } : m)));
    } catch (e) {
      console.error('[chat] no se pudo marcar como leído:', e);
    }
  }, [orderId, userId]);

  const noLeidos = useMemo(() => contarNoLeidos(mensajes, userId), [mensajes, userId]);

  return { mensajes, cargando, error, enviando, noLeidos, enviar, marcarLeidos, recargar };
};
