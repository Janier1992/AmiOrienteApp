# Estado del proyecto AmiOriente

Documento de traspaso: qué funciona, cómo se verificó y qué falta para comercializar.
Última revisión: octubre 2026.

## Cómo se verifica
- `npm run lint`, `npm test`, `npm run build` (también corren en el CI antes de desplegar).
- Recorrido en navegador real con un Supabase simulado (invitado, cliente, domiciliario y los 10 nichos de negocio). Verifica interfaz y lógica; **no** verifica RLS ni datos reales.

## Funciona (verificado)
- Invitado: directorio de negocios, productos, detalle, turismo, carrito.
- Compra: carrito de invitado → login (conserva el carrito) → checkout → pedido → confirmación. Varias tiendas: los fallos parciales se reportan sin duplicar pedidos.
- Registro/login de cliente, negocio y domiciliario, con redirección por rol y manejo de correo ya registrado / confirmación por correo.
- Panel de tienda para los 10 nichos (pestañas, POS, productos). El panel siempre se muestra en tema claro.
- Panel de domiciliario: ve los pedidos listos aunque esté desconectado; para aceptar debe conectarse. Si dos domiciliarios aceptan a la vez, el segundo recibe «ya fue tomado» (la base ya tiene `UNIQUE(order_id)` en `deliveries`).

- Turismo: muestra los lugares reales de `tourism_spots` (antes un error silencioso mostraba siempre los de ejemplo). Reservas de hotel y pedidos de restaurante se envían por WhatsApp al número del establecimiento.
- Pedidos del cliente se actualizan en vivo (Realtime) y ya no muestran una hora de entrega inventada.
- Pruebas unitarias de `orderService` (totales, rollback) y `deliveryService` (carrera al aceptar).
- Contraseñas: una sola política (8+ caracteres con mayúscula, minúscula, número y símbolo) en registro de cliente, negocio y domiciliario y en recuperar contraseña.
- Accesibilidad: auditoría automática (axe-core, WCAG A) sobre 25 pantallas sin violaciones críticas pendientes (salvo `aria-controls` de las pestañas de Radix, comportamiento conocido de la librería).
- Lista de deseos: corazón en productos y detalle (la tabla `wishlist` y su política RLS ya existen en la base).

## Seguridad y base de datos (octubre 2026)
Auditoría en `docs/AUDITORIA_SUPABASE_2026-10-07.md`. Las correcciones están en `database_updates/` y **deben aplicarse en Supabase en este orden** (todas idempotentes; hacer backup antes):
`20261007_*` (columnas faltantes, RLS de domiciliario, `create_order`, endurecimiento por lotes, stock, TRUNCATE) → `20261008_security_critical_fixes.sql` (A1–A4) → `20261008_delivery_status_rpc.sql` → `20261009_teams_plans_commissions.sql`.
- Flujo del domiciliario: aceptar usa `accept_order` y avanzar/cerrar usa `update_delivery_status` (ambas RPC validan en el servidor; el pedido pasa a "En curso" y "Entregado" junto con la entrega).
- `bash tools/db-test/run.sh` prueba las migraciones críticas y el flujo del domiciliario contra una réplica local de PostgreSQL (no contra tu Supabase real).

## Equipos, planes y comisiones (octubre 2026)
- **Planes**: tabla `plans` (Básico gratis + 10 %, Profesional $59.900 + 0 %, Empresarial a convenir). Precios y comisiones son una decisión de negocio **por confirmar**: se cambian con un `UPDATE` (ejemplos al final de la migración). La página de precios, «Mi Plan» y el Panel de Administración leen de esa tabla (`src/config/plans.js` solo es respaldo).
- **Comisión por venta**: sale del plan del negocio (antes: 22 % fijo dentro de un trigger, contradiciendo lo que mostraba la interfaz) y queda guardada en cada transacción.
- **Equipo de trabajo**: pestaña «Equipo». El dueño o un administrador del equipo agrega personas por correo (deben tener cuenta), cambia roles y quita miembros; el límite lo da el plan. Roles: *Administrador* (opera y gestiona el equipo) y *Colaborador* (pedidos y productos). Solo el dueño administra pagos, plan y configuración. Las cuentas de cliente agregadas ven «Ir a mi negocio» en su panel.
- **Cambio de plan**: manual por el administrador de la plataforma (Panel de Administración) hasta que existan pagos en línea; el negocio lo solicita desde «Mi Plan» (se crea un ticket de soporte).
- Pendiente de esta área: invitaciones para correos sin cuenta, permisos más finos por rol (hoy los colaboradores operan pedidos/productos/mesas/habitaciones; otras tablas siguen solo para el dueño) y cobro automático de la suscripción.

## Pendiente para comercializar
1. **Totales del pedido en el servidor (seguridad).** `orderService.crearPedido` calcula subtotal, envío, impuestos y descuento en el navegador; un usuario podría manipular el total. Solución: función SQL `create_order` (SECURITY DEFINER) que lea precios/tarifas de las tablas y valide cupones; el cliente solo envía producto y cantidad. Requiere el esquema real y pruebas contra la base.
2. **Auditar RLS tabla por tabla** (lectura pública de `stores`/`products`, pedidos visibles para domiciliarios, aislamiento entre tiendas) y exportar el esquema completo a una migración base: hoy solo existen parches en `database_updates/`.
3. **Pagos en línea.** Todo se registra como efectivo/contraentrega. La pestaña Pagos anuncia Bold como próxima integración.
4. **Cupón consumido antes de crear el pedido** (`redeem_discount`): si el pedido falla, el cupón ya se gastó. Resolver al mover la creación del pedido al servidor.
5. ~~Equipo de trabajo~~ (hecho; ver sección arriba).
6. **Datos de ejemplo**: el directorio muestra negocios de muestra si la plataforma aún no tiene tiendas.
7. **Normativa colombiana** (plataformas de domicilio y venta): pendiente de definir con el propietario. Al hacerlo, revisar también `TermsPage` y `PrivacyPolicyPage`: siguen llamando a la plataforma «Domicilios MiOriente» y los términos dicen que los pagos se procesan con Stripe, lo cual hoy no es cierto (todo es efectivo/transferencia).
8. ~~Planes y comisiones~~ (unificados en la tabla `plans`; falta que el propietario confirme los valores).
9. **Contraste de color (WCAG AA).** El texto blanco sobre el verde primario (`--primary`, `src/index.css`) da ~3,4:1; AA pide 4,5:1 en texto normal. Oscurecer un poco el verde lo resuelve (afecta la identidad de marca: decisión del propietario).
10. **Modo oscuro** en páginas públicas: algunas pantallas (p. ej. Servicios) tienen fondos fijos claros; el tema por defecto es claro.
11. Plan de Supabase de pago antes del primer cliente (respaldos, límites, rendimiento).
