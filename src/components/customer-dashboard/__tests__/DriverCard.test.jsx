import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DriverCard from '../DriverCard';

const mockRpc = vi.fn();
vi.mock('@/lib/customSupabaseClient', () => ({ supabase: { rpc: (...a) => mockRpc(...a) } }));

const PHOTO = `data:image/jpeg;base64,${'B'.repeat(2500)}`;

beforeEach(() => vi.clearAllMocks());

describe('DriverCard (lo que ve el cliente)', () => {
  it('muestra foto, nombre completo, documento enmascarado y placa del domiciliario', async () => {
    mockRpc.mockResolvedValue({ data: [{ full_name: 'Dora Domi Pérez', photo_jpeg: PHOTO, plate: 'ABC12D', vehicle_type: 'moto', document_masked: 'CC ******1234' }], error: null });
    render(<DriverCard orderId="o1" />);
    expect(await screen.findByText('Dora Domi Pérez')).toBeTruthy();
    expect(screen.getByAltText('Foto de Dora Domi Pérez').getAttribute('src')).toBe(PHOTO);
    expect(screen.getByText('Documento: CC ******1234')).toBeTruthy();
    expect(screen.getByLabelText('Placa ABC12D')).toBeTruthy();
    expect(screen.getByText('Motocicleta')).toBeTruthy();
    expect(mockRpc).toHaveBeenCalledWith('get_order_driver', { p_order_id: 'o1' });
  });

  it('si el pedido aún no tiene domiciliario no muestra nada', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { container } = render(<DriverCard orderId="o2" />);
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });

  it('si falla la consulta no rompe la pantalla del pedido', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'No tienes acceso a este pedido.' } });
    const { container } = render(<DriverCard orderId="o3" />);
    await waitFor(() => expect(mockRpc).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });

  it('sin foto muestra un avatar y sigue mostrando los datos', async () => {
    mockRpc.mockResolvedValue({ data: [{ full_name: 'Sin Foto', photo_jpeg: null, plate: null, vehicle_type: 'pie', document_masked: null }], error: null });
    render(<DriverCard orderId="o4" />);
    expect(await screen.findByText('Sin Foto')).toBeTruthy();
    expect(screen.queryByRole('img', { name: /Foto de/ })).toBeNull();
    expect(screen.getByText('A pie')).toBeTruthy();
  });
});
