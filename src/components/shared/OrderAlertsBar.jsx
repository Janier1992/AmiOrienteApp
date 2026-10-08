import React from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Franja del panel del negocio: cuántos pedidos esperan respuesta y controles de
 * sonido y notificaciones del navegador.
 */
const OrderAlertsBar = ({ pendingCount, soundOn, onToggleSound, permission, onEnableNotifications }) => (
  <div
    data-testid="order-alerts-bar"
    className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm"
  >
    <span className={pendingCount > 0 ? 'font-semibold text-amber-700' : 'text-muted-foreground'} role="status">
      {pendingCount > 0
        ? `${pendingCount} ${pendingCount === 1 ? 'pedido nuevo espera' : 'pedidos nuevos esperan'} tu respuesta`
        : 'Sin pedidos nuevos por atender'}
    </span>
    <div className="ml-auto flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onToggleSound} aria-pressed={soundOn}>
        {soundOn ? <Volume2 className="mr-1 h-4 w-4" /> : <VolumeX className="mr-1 h-4 w-4" />}
        {soundOn ? 'Sonido activado' : 'Sonido apagado'}
      </Button>
      {permission === 'default' && (
        <Button type="button" variant="outline" size="sm" onClick={onEnableNotifications}>
          <Bell className="mr-1 h-4 w-4" /> Activar avisos del navegador
        </Button>
      )}
      {permission === 'denied' && (
        <span className="flex items-center text-xs text-muted-foreground">
          <BellOff className="mr-1 h-4 w-4" /> Avisos del navegador bloqueados
        </span>
      )}
    </div>
  </div>
);

export default OrderAlertsBar;
