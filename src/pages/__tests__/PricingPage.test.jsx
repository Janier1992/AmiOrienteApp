import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PricingPage from '../PricingPage';

vi.mock('react-helmet', () => ({ Helmet: () => null }));
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: () => ({ select: () => ({ order: () => Promise.resolve({
      data: [
        { id: 'basic', name: 'Básico', description: 'd', price_cop: 0, commission_percent: 8, max_team_members: 2, features: ['Uno'], sort_order: 1 },
        { id: 'pro', name: 'Profesional', description: 'd', price_cop: 69900, commission_percent: 0, max_team_members: 10, features: ['Dos'], sort_order: 2 },
      ], error: null }) }) }),
  },
}));

describe('PricingPage', () => {
  it('muestra los planes y comisiones que vienen de la base de datos', async () => {
    render(<MemoryRouter><PricingPage /></MemoryRouter>);
    expect(await screen.findByText(/8 % por venta/)).toBeTruthy();
    expect(screen.getByText(/Sin comisión por venta/)).toBeTruthy();
    expect(screen.getByText(/69\.900/)).toBeTruthy();
    expect(screen.queryByText(/22/)).toBeNull();
  });
});
