import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-helmet', () => ({ Helmet: () => null }));
vi.mock('@/services/customerService', () => ({
  customerService: { getStores: vi.fn().mockResolvedValue({ data: [], count: 0 }) },
}));
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  },
}));

describe('sin datos de ejemplo en producción', () => {
  it('el directorio vacío muestra un mensaje honesto y ningún negocio inventado', async () => {
    const { default: StoresPage } = await import('../StoresPage');
    render(<MemoryRouter><StoresPage /></MemoryRouter>);
    expect(await screen.findByText('Aún no hay negocios registrados')).toBeTruthy();
    expect(screen.queryByText(/Próximamente en la plataforma/)).toBeNull();
  });

  it('turismo vacío no inventa lugares', async () => {
    const { default: TourismPage } = await import('../TourismPage');
    render(<MemoryRouter><TourismPage /></MemoryRouter>);
    expect(await screen.findByText('Pronto habrá lugares para descubrir')).toBeTruthy();
    expect(screen.queryByText(/Alcaravanes/)).toBeNull();
  });
});
