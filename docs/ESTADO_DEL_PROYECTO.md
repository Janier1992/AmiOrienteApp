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
- Panel de domiciliario: ve los pedidos listos aunque esté desconectado; para aceptar debe conectarse. Si dos domiciliarios aceptan a la vez, el segundo recibe «ya fue tomado» (requiere aplicar `database_updates/20261007_unique_active_delivery_per_order.sql`).

- Turismo: muestra los lugares reales de `tourism_spots` (antes un error silencioso mostraba siempre los de ejemplo). Reservas de hotel y pedidos de restaurante se envían por WhatsApp al número del establecimiento.
- Pedidos del cliente se actualizan en vivo (Realtime) y ya no muestran una hora de entrega inventada.
- Pruebas unitarias de `orderService` (totales, rollback) y `deliveryService` (carrera al aceptar).
- Lista de deseos: corazón en productos y detalle (requiere `database_updates/20261007_wishlist_policies.sql`).

## Pendiente para comercializar
1. **Totales del pedido en el servidor (seguridad).** `orderService.crearPedido` calcula subtotal, envío, impuestos y descuento en el navegador; un usuario podría manipular el total. Solución: función SQL `create_order` (SECURITY DEFINER) que lea precios/tarifas de las tablas y valide cupones; el cliente solo envía producto y cantidad. Requiere el esquema real y pruebas contra la base.
2. **Auditar RLS tabla por tabla** (lectura pública de `stores`/`products`, pedidos visibles para domiciliarios, aislamiento entre tiendas) y exportar el esquema completo a una migración base: hoy solo existen parches en `database_updates/`.
3. **Pagos en línea.** Todo se registra como efectivo/contraentrega. La pestaña Pagos anuncia Bold como próxima integración.
4. **Cupón consumido antes de crear el pedido** (`redeem_discount`): si el pedido falla, el cupón ya se gastó. Resolver al mover la creación del pedido al servidor.
5. **Equipo de trabajo** (invitar miembros a una tienda) no está implementado.
6. **Datos de ejemplo**: el directorio muestra negocios de muestra si la plataforma aún no tiene tiendas.
7. **Normativa colombiana** (plataformas de domicilio y venta): pendiente de definir con el propietario. Al hacerlo, revisar también `TermsPage` y `PrivacyPolicyPage`: siguen llamando a la plataforma «Domicilios MiOriente» y los términos dicen que los pagos se procesan con Stripe, lo cual hoy no es cierto (todo es efectivo/transferencia).
8. **Planes y comisiones**: `PricingPage` muestra 22 % / 15 % + $59.900, mientras el README habla de 8-10 % y $50.000-$80.000. Decidir cuál es el modelo definitivo y alinear README, página y comisión por defecto de la base de datos (22 %).
9. **Modo oscuro** en páginas públicas: algunas pantallas (p. ej. Servicios) tienen fondos fijos claros; el tema por defecto es claro.
10. Plan de Supabase de pago antes del primer cliente (respaldos, límites, rendimiento).
