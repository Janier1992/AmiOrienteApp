import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OrdersTab } from '../OrdersTab';

const mockCancel = vi.fn();
vi.mock('@/services/orderService', () => ({ orderService: { cancelarPedido: (...a) => mockCancel(...a) } }));
vi.mock('@/components/customer-dashboard/DriverCard', () => ({ default: () => null }));
vi.mock('../OrderTrackingMap', () => ({ default: () => null }));
vi.mock('../OrderDetailsModal', () => ({ default: () => null }));

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
});
