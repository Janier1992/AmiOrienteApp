import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InProgressOrdersTab from '../InProgressOrdersTab';
import { deliveryService } from '@/services/deliveryService';

vi.mock('../DeliveryMap', () => ({ default: () => null }));
vi.mock('@/components/shared/OrderChat', () => ({ default: () => null }));
vi.mock('@/services/deliveryService', () => ({ deliveryService: { obtenerContactoDelCliente: vi.fn() } }));

const pedido = {
  id: 'aaaaaaaa-0000-0000-0000-000000000000', total: 20000, status: 'En curso',
  deliveries: { pickup_address: 'Tienda', delivery_address: 'Calle 1' },
};

const botonLlamar = () => screen.getByRole('button', { name: /llamar/i });

beforeEach(() => vi.clearAllMocks());

describe('InProgressOrdersTab · botón Llamar', () => {
  it('se habilita con el teléfono que entrega el servidor', async () => {
    deliveryService.obtenerContactoDelCliente.mockResolvedValue({ first_name: 'Ana', phone: '3001234567' });
    render(<InProgressOrdersTab orders={[pedido]} onCompleteOrder={() => {}} />);
    await waitFor(() => expect(botonLlamar().disabled).toBe(false));
    expect(botonLlamar().closest('a').getAttribute('href')).toBe('tel:3001234567');
    expect(deliveryService.obtenerContactoDelCliente).toHaveBeenCalledWith(pedido.id);
  });

  it('queda deshabilitado si el servidor no entrega el teléfono', async () => {
    deliveryService.obtenerContactoDelCliente.mockResolvedValue(null);
    render(<InProgressOrdersTab orders={[pedido]} onCompleteOrder={() => {}} />);
    await waitFor(() => expect(deliveryService.obtenerContactoDelCliente).toHaveBeenCalled());
    expect(botonLlamar().disabled).toBe(true);
    expect(botonLlamar().closest('a').getAttribute('href')).toBeNull();
  });

  it('queda deshabilitado si la consulta falla (sin romper la pantalla)', async () => {
    deliveryService.obtenerContactoDelCliente.mockRejectedValue(new Error('sin conexión'));
    render(<InProgressOrdersTab orders={[pedido]} onCompleteOrder={() => {}} />);
    await waitFor(() => expect(deliveryService.obtenerContactoDelCliente).toHaveBeenCalled());
    expect(botonLlamar().disabled).toBe(true);
  });
});
