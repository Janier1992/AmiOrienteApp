import { describe, it, expect } from 'vitest';
import { normalizeColombianPhone, buildWhatsAppUrl } from '../contact';

describe('normalizeColombianPhone', () => {
  it('agrega el indicativo 57 a números locales', () => {
    expect(normalizeColombianPhone('315 816 99 48')).toBe('573158169948');
    expect(normalizeColombianPhone('3158169948')).toBe('573158169948');
  });
  it('respeta números con indicativo', () => {
    expect(normalizeColombianPhone('+57 315 816 9948')).toBe('573158169948');
    expect(normalizeColombianPhone('0057 3158169948')).toBe('573158169948');
  });
  it('rechaza valores vacíos o inválidos', () => {
    expect(normalizeColombianPhone(null)).toBeNull();
    expect(normalizeColombianPhone('')).toBeNull();
    expect(normalizeColombianPhone('12345')).toBeNull();
  });
});

describe('buildWhatsAppUrl', () => {
  it('codifica el mensaje', () => {
    expect(buildWhatsAppUrl('3158169948', 'Hola, quiero reservar')).toBe(
      'https://wa.me/573158169948?text=Hola%2C%20quiero%20reservar'
    );
  });
  it('devuelve null sin teléfono válido', () => {
    expect(buildWhatsAppUrl('abc', 'hola')).toBeNull();
  });
});
