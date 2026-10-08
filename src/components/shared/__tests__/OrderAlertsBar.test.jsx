import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderAlertsBar from '../OrderAlertsBar';

const base = { pendingCount: 0, soundOn: true, onToggleSound: vi.fn(), permission: 'granted', onEnableNotifications: vi.fn() };

describe('OrderAlertsBar', () => {
  it('muestra cuántos pedidos esperan respuesta', () => {
    render(<OrderAlertsBar {...base} pendingCount={2} />);
    expect(screen.getByRole('status').textContent).toBe('2 pedidos nuevos esperan tu respuesta');
  });
  it('en singular y sin pedidos', () => {
    const { rerender } = render(<OrderAlertsBar {...base} pendingCount={1} />);
    expect(screen.getByRole('status').textContent).toBe('1 pedido nuevo espera tu respuesta');
    rerender(<OrderAlertsBar {...base} />);
    expect(screen.getByRole('status').textContent).toBe('Sin pedidos nuevos por atender');
  });
  it('permite apagar el sonido y pedir permiso de notificaciones', () => {
    const onToggleSound = vi.fn(); const onEnableNotifications = vi.fn();
    render(<OrderAlertsBar {...base} permission="default" onToggleSound={onToggleSound} onEnableNotifications={onEnableNotifications} />);
    fireEvent.click(screen.getByText('Sonido activado'));
    fireEvent.click(screen.getByText('Activar avisos del navegador'));
    expect(onToggleSound).toHaveBeenCalled();
    expect(onEnableNotifications).toHaveBeenCalled();
  });
  it('si el navegador bloqueó los avisos lo dice y no ofrece activarlos', () => {
    render(<OrderAlertsBar {...base} permission="denied" soundOn={false} />);
    expect(screen.getByText('Avisos del navegador bloqueados')).toBeTruthy();
    expect(screen.queryByText('Activar avisos del navegador')).toBeNull();
    expect(screen.getByText('Sonido apagado')).toBeTruthy();
  });
});
