/**
 * Planes de la plataforma.
 *
 * La fuente de verdad es la tabla `plans` de Supabase (precio, comisión y límite
 * de equipo se cambian ahí con un UPDATE; ver database_updates/
 * 20261009_teams_plans_commissions.sql). Estos valores son SOLO el respaldo para
 * mostrar la página de precios cuando la base no responde o aún no tiene la
 * migración aplicada; deben mantenerse iguales a los valores iniciales de la tabla.
 */
export const FALLBACK_PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Para empezar a vender sin costo fijo: pagas solo cuando vendes.',
    price_cop: 0,
    commission_percent: 10,
    max_team_members: 2,
    features: [
      'Productos y pedidos ilimitados',
      'Panel de control del negocio',
      'Equipo de hasta 2 personas (tú y 1 colaborador)',
      'Pagos en efectivo y transferencia',
    ],
  },
  {
    id: 'pro',
    name: 'Profesional',
    description: 'Para negocios con ventas constantes: sin comisión por venta.',
    price_cop: 59900,
    commission_percent: 0,
    max_team_members: 10,
    features: [
      'Todo lo del plan Básico',
      '0 % de comisión por venta',
      'Equipo de hasta 10 personas',
      'Posicionamiento destacado en la app',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Para operaciones grandes o con necesidades a medida. Se acuerda con ventas.',
    price_cop: 0,
    commission_percent: 0,
    max_team_members: null,
    features: [
      'Todo lo del plan Profesional',
      'Equipo ilimitado',
      'Condiciones y comisiones a convenir',
      'Gerente de cuenta dedicado',
    ],
  },
];

/** Plan que no se contrata solo: se acuerda con ventas y lo asigna el administrador. */
export const CUSTOM_PLAN_ID = 'enterprise';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** $59.900 */
export const formatCOP = (value) => copFormatter.format(Number(value) || 0);

/** "Gratis", "$59.900 / mes" o "A convenir" según el plan. */
export const describePrice = (plan) => {
  if (plan.id === CUSTOM_PLAN_ID) return { amount: 'A convenir', suffix: '' };
  if (!Number(plan.price_cop)) return { amount: 'Gratis', suffix: '' };
  return { amount: formatCOP(plan.price_cop), suffix: ' / mes' };
};

/** "10 % por venta" / "Sin comisión por venta" / "Comisión a convenir". */
export const describeCommission = (plan) => {
  if (plan.id === CUSTOM_PLAN_ID) return 'Comisión a convenir';
  const pct = Number(plan.commission_percent) || 0;
  return pct === 0 ? 'Sin comisión por venta' : `${pct} % por venta`;
};

/** "Hasta 2 personas" / "Equipo ilimitado". */
export const describeTeamLimit = (plan) =>
  plan.max_team_members == null ? 'Equipo ilimitado' : `Hasta ${plan.max_team_members} personas`;
