import { describe, it, expect } from 'vitest';
import {
  DECLARATION_STATEMENTS,
  buildDeclarationPayload,
  buildDeclarationText,
  emptyDeclaration,
  validateDeclaration,
} from '../driverDeclaration';
import { buildPrintableHtml, escapeHtml, safeSignatureSrc } from '../printDocument';

const SIG = `data:image/png;base64,${'A'.repeat(400)}`;
const TODAY = '2026-10-10';

const complete = () => ({
  ...emptyDeclaration(),
  documentNumber: '1037000111',
  plate: 'ABC12D',
  licenseNumber: 'LIC-998877',
  licenseExpiry: '2028-01-01',
  soatInsurer: 'Seguros Bolívar',
  soatExpiry: '2027-03-01',
  techExpiry: '2027-04-01',
  health: 'Sura',
  pension: 'Porvenir',
  arl: 'Positiva',
  statements: Object.fromEntries(DECLARATION_STATEMENTS.map((s) => [s.key, true])),
});

describe('validateDeclaration', () => {
  it('acepta una declaración completa y vigente', () => {
    expect(validateDeclaration(complete(), SIG, TODAY)).toBeNull();
  });

  it('exige la firma', () => {
    expect(validateDeclaration(complete(), null, TODAY)).toMatch(/firma/i);
  });

  it('rechaza documentos vencidos (SOAT, licencia, técnico-mecánica)', () => {
    expect(validateDeclaration({ ...complete(), soatExpiry: '2026-10-09' }, SIG, TODAY)).toMatch(/SOAT está vencido/);
    expect(validateDeclaration({ ...complete(), licenseExpiry: '2020-01-01' }, SIG, TODAY)).toMatch(/licencia de conducción está vencido/i);
    expect(validateDeclaration({ ...complete(), techExpiry: '2025-01-01' }, SIG, TODAY)).toMatch(/técnico-mecánica está vencido/);
  });

  it('un documento que vence hoy todavía es válido', () => {
    expect(validateDeclaration({ ...complete(), soatExpiry: TODAY }, SIG, TODAY)).toBeNull();
  });

  it('exige placa válida para vehículos motorizados', () => {
    expect(validateDeclaration({ ...complete(), plate: '12' }, SIG, TODAY)).toMatch(/placa/i);
    expect(validateDeclaration({ ...complete(), plate: 'abc-123' }, SIG, TODAY)).toBeNull();
  });

  it('a pie o en bicicleta no exige placa, licencia, SOAT ni técnico-mecánica', () => {
    const walker = { ...complete(), vehicleType: 'pie', plate: '', licenseNumber: '', licenseExpiry: '', soatInsurer: '', soatExpiry: '', techExpiry: '' };
    expect(validateDeclaration(walker, SIG, TODAY)).toBeNull();
  });

  it('exige EPS, pensión y ARL (debe estar afiliado)', () => {
    expect(validateDeclaration({ ...complete(), arl: '' }, SIG, TODAY)).toMatch(/afiliado/i);
  });

  it('exige marcar todas las declaraciones', () => {
    const v = complete();
    v.statements.independiente = false;
    expect(validateDeclaration(v, SIG, TODAY)).toMatch(/declaraciones/i);
  });
});

describe('texto del documento', () => {
  const meta = { fullName: ' Dora Domi ', email: 'dora@correo.com', version: '2026-10-09', signedAt: new Date('2026-10-10T15:00:00') };

  it('incluye los datos declarados, las declaraciones y la versión', () => {
    const text = buildDeclarationText(complete(), meta);
    expect(text).toContain('Dora Domi');
    expect(text).toContain('1037000111');
    expect(text).toContain('ABC12D');
    expect(text).toContain('Seguros Bolívar');
    expect(text).toContain('Versión de los Términos: 2026-10-09');
    DECLARATION_STATEMENTS.forEach((s, i) => expect(text).toContain(`${i + 1}. ${s.text.slice(0, 30)}`));
    expect(text).toMatch(/gravedad del juramento/);
    expect(text.length).toBeGreaterThan(200); // el servidor exige un mínimo
  });

  it('quien va a pie no lleva datos de vehículo en el documento', () => {
    const text = buildDeclarationText({ ...complete(), vehicleType: 'pie' }, meta);
    expect(text).not.toMatch(/Placa|SOAT:|Licencia de conducción No\./);
    expect(buildDeclarationPayload({ ...complete(), vehicleType: 'pie' }).plate).toBeNull();
  });
});

describe('impresión segura', () => {
  it('escapa el HTML del texto guardado', () => {
    const html = buildPrintableHtml({ title: 'T', text: '<script>alert(1)</script>', signatureSrc: SIG, footerLines: ['<b>x</b>'] });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(escapeHtml('"a" & <b>')).toBe('&quot;a&quot; &amp; &lt;b&gt;');
  });

  it('solo acepta una firma PNG en base64', () => {
    expect(safeSignatureSrc(SIG)).toBe(SIG);
    expect(safeSignatureSrc('javascript:alert(1)')).toBe('');
    expect(safeSignatureSrc('data:text/html;base64,AAAA')).toBe('');
    expect(safeSignatureSrc(`${SIG}" onerror="x`)).toBe('');
  });
});
