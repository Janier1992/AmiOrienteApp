import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-helmet', () => ({ Helmet: () => null }));

// Supabase inalcanzable: toda consulta devuelve error de red (como un proyecto pausado).
const consulta = vi.hoisted(() => ({ llamadas: 0 }));
vi.mock('@/lib/customSupabaseClient', () => {
  const error = { message: 'Failed to fetch' };
  const cadena = {
    select: () => cadena,
    eq: () => cadena,
    in: () => cadena,
    order: () => { consulta.llamadas += 1; return Promise.resolve({ data: null, error }); },
    single: () => Promise.resolve({ data: null, error }),
    then: (res) => Promise.resolve({ data: null, error }).then(res),
  };
  return { supabase: { from: () => cadena } };
});
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/CartSidebar', () => ({ default: () => null }));
vi.mock('@/contexts/CartContext', () => ({
  useCartStore: (selector) => selector({ getCartItemCount: () => 0 }),
  useCartActions: () => ({ addToCart: vi.fn() }),
}));

describe('cuando no hay conexión con el servidor', () => {
  it('productos avisa del problema (no dice «sin productos») y permite reintentar', async () => {
    const { default: ProductsPage } = await import('../ProductsPage');
    render(<MemoryRouter><ProductsPage /></MemoryRouter>);
    expect(await screen.findByText('No pudimos cargar los productos')).toBeTruthy();
    expect(screen.queryByText(/aún no tiene productos/)).toBeNull();

    const antes = consulta.llamadas;
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(consulta.llamadas).toBeGreaterThan(antes));
  });

  it('turismo avisa del problema (no dice «pronto habrá lugares»)', async () => {
    const { default: TourismPage } = await import('../TourismPage');
    render(<MemoryRouter><TourismPage /></MemoryRouter>);
    expect(await screen.findByText('No pudimos cargar los lugares')).toBeTruthy();
    expect(screen.queryByText('Pronto habrá lugares para descubrir')).toBeNull();
  });
});
