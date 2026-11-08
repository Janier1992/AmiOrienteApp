import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OrdersTab } from '../OrdersTab';

const mockCancel = vi.fn();
vi.mock('@/services/orderService', () => ({ orderService: { cancelarPedido: (...a) => mockCancel(...a) } }));
vi.mock('@/components/customer-dashboard/DriverCard', () => ({ default: () => null }));
vi.mock('../OrderTrackingMap', () => ({ default: () => null }));
vi.mock('../OrderDetailsModal', () => ({ default: () => null }));
vi.mock('@/components/shared/OrderChat', () => ({ default: ({ orderId, status }) => <span data-testid="chat">{orderId.slice(0, 2)}:{status}</span> }));

const order = (id, status, extra = {}) => ({
  id: `${id}-aaaaaaaa-0000-0000-0000-000000000000`, status, total: 10000, created_at: '2026-10-01T10:00:00Z',
  stores: { name: 'Tienda ' + id }, order_items: [{}], ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe('OrdersTab del cliente', () => {
  it('los pedidos confirmados o en preparación aparecen como activos (no desaparecen)', () => {
    render(<OrdersTab orders={[order('a', 'Confirmado'), order('b', 'En preparación'), order('c', 'Listo para recogida'), order('d', 'Entregado')]} />);
    expect(screen.getByText('En Curso (3)')).toBeTruthy();
    expect(screen.getByText('Historial (1)')).toBeTruthy();
  });

  it('ofrece cancelar solo mientras el negocio no prepara el pedido', () => {
    render(<OrdersTab orders={[order('a', 'Pendiente'), order('b', 'Confirmado'), order('c', 'En preparación'), order('d', 'En curso')]} />);
    expect(screen.getAllByText('Cancelar pedido')).toHaveLength(2);
  });

  it('cancela con motivo, avisa y recarga la lista', async () => {
    mockCancel.mockResolvedValue({});
    const onOrdersChanged = vi.fn();
    render(<OrdersTab orders={[order('a', 'Pendiente')]} onOrdersChanged={onOrdersChanged} />);
    fireEvent.click(screen.getByText('Cancelar pedido'));
    fireEvent.change(await screen.findByLabelText('Motivo (opcional)'), { target: { value: 'Me equivoqué' } });
    fireEvent.click(screen.getByText('Sí, cancelar pedido'));
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith(expect.stringMatching(/^a-/), 'Me equivoqué'));
    await waitFor(() => expect(onOrdersChanged).toHaveBeenCalled());
  });

  it('si el servidor rechaza la cancelación no recarga y deja el diálogo abierto', async () => {
    mockCancel.mockRejectedValue(new Error('El pedido ya va en camino.'));
    const onOrdersChanged = vi.fn();
    render(<OrdersTab orders={[order('a', 'Pendiente')]} onOrdersChanged={onOrdersChanged} />);
    fireEvent.click(screen.getByText('Cancelar pedido'));
    fireEvent.click(await screen.findByText('Sí, cancelar pedido'));
    await waitFor(() => expect(mockCancel).toHaveBeenCalled());
    expect(onOrdersChanged).not.toHaveBeenCalled();
    expect(screen.getByText('Sí, cancelar pedido')).toBeTruthy();
  });

  describe('chat con el domiciliario', () => {
    const hace = (dias) => new Date(Date.now() - dias * 86400000).toISOString();

    it('se ofrece en un pedido en camino', () => {
      render(<OrdersTab orders={[order('a1', 'En curso', { deliveries: { delivery_person_id: 'd' } })]} />);
      expect(screen.getByTestId('chat').textContent).toBe('a1:En curso');
    });

    it('no se ofrece si el pedido aún no va en camino', () => {
      render(<OrdersTab orders={[order('b1', 'Confirmado', { deliveries: null })]} />);
      expect(screen.queryByTestId('chat')).toBeNull();
    });

    it('queda como archivo en un pedido entregado hace menos de 30 días, y no después', () => {
      render(<OrdersTab orders={[
        order('c1', 'Entregado', { created_at: hace(5), deliveries: { delivery_person_id: 'd' } }),
        order('c2', 'Entregado', { created_at: hace(45), deliveries: { delivery_person_id: 'd' } }),
      ]} />);
      fireEvent.mouseDown(screen.getByRole('tab', { name: /historial/i }));
      fireEvent.click(screen.getByRole('tab', { name: /historial/i }));
      expect(screen.getAllByTestId('chat').map((n) => n.textContent)).toEqual(['c1:Entregado']);
    });
  });
});
