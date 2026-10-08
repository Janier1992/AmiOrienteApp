import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamTab from '../TeamTab';

const mockRpc = vi.fn();
vi.mock('@/lib/customSupabaseClient', () => ({ supabase: { rpc: (...a) => mockRpc(...a) } }));
vi.mock('@/contexts/SupabaseAuthContext', () => ({ useAuth: () => ({ user: { id: 'u-owner' } }) }));
const toast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({ toast: (...a) => toast(...a) }));

const team = [
  { user_id: 'u-owner', email: 'dueno@t.co', full_name: 'Dueña', role: 'admin', is_owner: true },
  { user_id: 'u-ed', email: 'ed@t.co', full_name: 'Edgar', role: 'editor', is_owner: false },
];
const planInfo = [{ plan_id: 'basic', plan_name: 'Básico', commission_percent: 10, max_team_members: 5, team_count: 2, features: [] }];

const respond = ({ add } = {}) => mockRpc.mockImplementation((fn) => {
  if (fn === 'get_store_team') return Promise.resolve({ data: team, error: null });
  if (fn === 'get_store_plan_info') return Promise.resolve({ data: planInfo, error: null });
  if (fn === 'add_store_member') return Promise.resolve(add || { data: null, error: null });
  return Promise.resolve({ data: null, error: null });
});

beforeEach(() => { vi.clearAllMocks(); respond(); });

describe('TeamTab', () => {
  it('lista al equipo, marca al dueño y muestra el uso del plan', async () => {
    render(<TeamTab storeId="s1" store={{ name: 'Mi Tienda', viewerRole: 'owner' }} />);
    expect(await screen.findByText('Edgar')).toBeTruthy();
    expect(screen.getByText('Dueño')).toBeTruthy();
    expect(screen.getByText(/Tu plan Básico/)).toBeTruthy();
  });

  it('el dueño puede agregar a una persona por correo', async () => {
    render(<TeamTab storeId="s1" store={{ name: 'Mi Tienda', viewerRole: 'owner' }} />);
    const input = await screen.findByLabelText('Correo');
    fireEvent.change(input, { target: { value: 'nuevo@t.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(mockRpc).toHaveBeenCalledWith('add_store_member',
      { p_store_id: 's1', p_email: 'nuevo@t.co', p_role: 'editor' }));
  });

  it('muestra el error del servidor (p. ej. correo sin cuenta) y no rompe la pantalla', async () => {
    respond({ add: { data: null, error: { message: 'No encontramos una cuenta con ese correo.' } } });
    render(<TeamTab storeId="s1" store={{ name: 'Mi Tienda', viewerRole: 'owner' }} />);
    fireEvent.change(await screen.findByLabelText('Correo'), { target: { value: 'nadie@t.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: expect.stringContaining('No encontramos una cuenta'), variant: 'destructive' })));
  });

  it('un colaborador solo ve el equipo: sin formulario ni botones de quitar', async () => {
    render(<TeamTab storeId="s1" store={{ name: 'Mi Tienda', viewerRole: 'editor' }} />);
    await screen.findByText('Edgar');
    expect(screen.queryByLabelText('Correo')).toBeNull();
    expect(screen.queryByRole('button', { name: /Quitar a/ })).toBeNull();
  });
});
