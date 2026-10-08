import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useStoreDashboard } from '@/stores/useStoreDashboard';
import { toast } from '@/components/ui/use-toast';
import { isNewOrder } from '@/lib/orderRules';
import {
  getSoundPreference,
  notificationPermission,
  playNewOrderChime,
  requestBrowserNotifications,
  setSoundPreference,
  showBrowserNotification,
  unlockAudio,
} from '@/lib/orderAlerts';

export const POLL_MS = 30000;

const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;

/**
 * Mantiene al negocio al tanto de sus pedidos mientras tenga el panel abierto, sin importar
 * en qué pestaña esté: avisa al instante de cada pedido nuevo (sonido, mensaje y, si lo
 * permite, notificación del navegador) y de los que el cliente cancela.
 *
 * Usa Realtime y, por si la conexión en vivo falla, consulta cada 30 segundos y al volver
 * a la pestaña. La primera carga solo fija el punto de partida (no avisa de lo ya existente).
 */
export const useNewOrderAlerts = (storeId) => {
  const orders = useStoreDashboard((s) => s.orders);
  const fetchOrders = useStoreDashboard((s) => s.fetchOrders);
  const [soundOn, setSoundOn] = useState(getSoundPreference);
  const [permission, setPermission] = useState(notificationPermission);
  const known = useRef(null); // Map id -> status; null hasta la primera carga
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const refresh = useCallback(() => fetchOrders(storeId, true), [fetchOrders, storeId]);

  // Detecta pedidos nuevos y cancelaciones comparando con lo que ya se conocía.
  useEffect(() => {
    if (!storeId) return;
    const current = new Map(orders.map((o) => [o.id, o.status]));
    if (known.current === null) {
      if (orders.length > 0 || current.size === 0) {
        // Primera lista recibida: es el punto de partida.
        known.current = current;
        if (orders.length === 0) known.current = new Map();
      }
      return;
    }
    const fresh = orders.filter((o) => !known.current.has(o.id) && isNewOrder(o));
    const cancelled = orders.filter((o) => o.status === 'Cancelado' && known.current.has(o.id) && known.current.get(o.id) !== 'Cancelado');

    if (fresh.length > 0) {
      const first = fresh[0];
      const title = fresh.length === 1 ? '¡Nuevo pedido!' : `¡${fresh.length} pedidos nuevos!`;
      const detail = fresh.length === 1 ? `#${first.id.substring(0, 8)} · ${money(first.total)}` : 'Revisa la sección de pedidos.';
      toast({ title, description: detail });
      if (soundRef.current) playNewOrderChime();
      showBrowserNotification(title, detail);
    }
    cancelled.forEach((o) => {
      toast({ title: 'Pedido cancelado', description: `Se canceló el pedido #${o.id.substring(0, 8)}.`, variant: 'destructive' });
    });
    known.current = current;
  }, [orders, storeId]);

  // Realtime + respaldo por consulta periódica.
  useEffect(() => {
    if (!storeId) return undefined;
    known.current = null;
    refresh();

    const channel = supabase
      .channel(`store-orders-${storeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, () => refresh())
      .subscribe();

    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [storeId, refresh]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    setSoundOn(next);
    setSoundPreference(next);
    if (next) { unlockAudio(); playNewOrderChime(); }
  }, []);

  const enableNotifications = useCallback(async () => {
    unlockAudio();
    setPermission(await requestBrowserNotifications());
  }, []);

  const pendingCount = useMemo(() => orders.filter(isNewOrder).length, [orders]);

  return { pendingCount, soundOn, toggleSound, permission, enableNotifications };
};
