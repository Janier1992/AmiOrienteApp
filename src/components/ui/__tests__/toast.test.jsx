import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast, ToastClose, ToastProvider, ToastTitle, ToastViewport } from '../toast';

describe('Toast · accesibilidad', () => {
  it('el botón de cerrar tiene nombre accesible en español (hallazgo axe button-name)', () => {
    render(
      <ToastProvider>
        <Toast open><ToastTitle>Aviso</ToastTitle><ToastClose /></Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByRole('button', { name: 'Cerrar notificación' })).toBeTruthy();
  });
});
