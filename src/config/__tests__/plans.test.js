import { describe, it, expect } from 'vitest';
import { FALLBACK_PLANS, describePrice, describeCommission, describeTeamLimit, formatCOP } from '../plans';

describe('plans', () => {
  const [basic, pro, enterprise] = FALLBACK_PLANS;

  it('formatea pesos colombianos', () => {
    expect(formatCOP(59900).replace(/\s/g, '')).toBe('$59.900');
  });

  it('describe el precio de cada plan', () => {
    expect(describePrice(basic)).toEqual({ amount: 'Gratis', suffix: '' });
    expect(describePrice(pro).amount.replace(/\s/g, '')).toBe('$59.900');
    expect(describePrice(pro).suffix).toBe(' / mes');
    expect(describePrice(enterprise).amount).toBe('A convenir');
  });

  it('describe la comisión', () => {
    expect(describeCommission(basic)).toBe('10 % por venta');
    expect(describeCommission(pro)).toBe('Sin comisión por venta');
    expect(describeCommission(enterprise)).toBe('Comisión a convenir');
  });

  it('describe el límite de equipo', () => {
    expect(describeTeamLimit(basic)).toBe('Hasta 2 personas');
    expect(describeTeamLimit(enterprise)).toBe('Equipo ilimitado');
  });

  it('el plan básico tiene comisión y cupo mayores que cero (el equipo siempre incluye al dueño)', () => {
    expect(basic.commission_percent).toBeGreaterThan(0);
    expect(basic.max_team_members).toBeGreaterThanOrEqual(2);
  });
});
