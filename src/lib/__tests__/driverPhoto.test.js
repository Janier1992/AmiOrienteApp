import { describe, it, expect } from 'vitest';
import { canvasToJpeg, isPhotoDataUrl, PHOTO_MAX_CHARS } from '../driverPhoto';

const photo = (n) => `data:image/jpeg;base64,${'B'.repeat(n)}`;

describe('driverPhoto', () => {
  it('solo acepta JPEG en base64 de tamaño razonable', () => {
    expect(isPhotoDataUrl(photo(2500))).toBe(true);
    expect(isPhotoDataUrl(photo(10))).toBe(false); // muy pequeña
    expect(isPhotoDataUrl(photo(251000))).toBe(false); // demasiado grande
    expect(isPhotoDataUrl('data:image/png;base64,' + 'B'.repeat(2500))).toBe(false);
    expect(isPhotoDataUrl(`${photo(2500)}" onerror="x`)).toBe(false);
    expect(isPhotoDataUrl(null)).toBe(false);
  });

  it('baja la calidad del JPEG hasta que la foto cabe en el límite', () => {
    const calls = [];
    const canvas = {
      toDataURL: (type, q) => {
        calls.push(q);
        return photo(q > 0.6 ? PHOTO_MAX_CHARS + 5000 : 20000);
      },
    };
    const out = canvasToJpeg(canvas);
    expect(out.length).toBeLessThanOrEqual(PHOTO_MAX_CHARS);
    expect(calls.length).toBeGreaterThan(1);
    expect(calls[calls.length - 1]).toBeLessThan(calls[0]);
  });
});
