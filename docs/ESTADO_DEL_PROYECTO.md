# Estado del proyecto AmiOriente

Documento de traspaso: qué funciona, cómo se verificó y qué falta para comercializar.
Última revisión: 28 de octubre de 2026.

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
`20261007_*` (columnas faltantes, RLS de domiciliario, `create_order`, endurecimiento por lotes, stock, TRUNCATE) → `20261008_security_critical_fixes.sql` → `20261008_delivery_status_rpc.sql` → `20261009_teams_plans_commissions.sql` → `20261010_legal_consents.sql` → `20261011_driver_declarations.sql` → `20261012_accept_order_requires_declaration.sql` → `20261013_driver_photo.sql` → `20261014_cancel_order_and_realtime.sql` → `20261015_order_chat.sql`.
- El total del pedido, la comisión y el rol se calculan o protegen en el servidor (`create_order`, disparadores `protect_*`); el navegador no puede alterarlos.
- Flujo del domiciliario: aceptar usa `accept_order` (exige declaración firmada y fotografía) y avanzar/cerrar usa `update_delivery_status`.
- Cancelar usa `cancel_order`: valida quién y en qué estado, y devuelve el inventario una sola vez. La tabla `orders` debe estar en la publicación `supabase_realtime` (la migración lo asegura).
- `bash tools/db-test/run.sh` prueba las migraciones contra una réplica local de PostgreSQL (**no** contra tu Supabase real): 206 verificaciones.

## Equipos, planes y comisiones (octubre 2026)
- **Planes**: tabla `plans` (Básico gratis + 10 %, Profesional $59.900 + 0 %, Empresarial a convenir). Precios y comisiones son una decisión de negocio **por confirmar**: se cambian con un `UPDATE` (ejemplos al final de la migración). La página de precios, «Mi Plan» y el Panel de Administración leen de esa tabla (`src/config/plans.js` solo es respaldo).
- **Comisión por venta**: sale del plan del negocio (antes: 22 % fijo dentro de un trigger, contradiciendo lo que mostraba la interfaz) y queda guardada en cada transacción.
- **Equipo de trabajo**: pestaña «Equipo». El dueño o un administrador del equipo agrega personas por correo (deben tener cuenta), cambia roles y quita miembros; el límite lo da el plan. Roles: *Administrador* (opera y gestiona el equipo) y *Colaborador* (pedidos y productos). Solo el dueño administra pagos, plan y configuración. Las cuentas de cliente agregadas ven «Ir a mi negocio» en su panel.
- **Cambio de plan**: manual por el administrador de la plataforma (Panel de Administración) hasta que existan pagos en línea; el negocio lo solicita desde «Mi Plan» (se crea un ticket de soporte).
- Pendiente de esta área: invitaciones para correos sin cuenta, permisos más finos por rol (hoy los colaboradores operan pedidos/productos/mesas/habitaciones; otras tablas siguen solo para el dueño) y cobro automático de la suscripción.

## Avisos de pedidos y cancelación (octubre 2026)
- El panel del negocio avisa de cada pedido nuevo con mensaje, sonido y notificación del navegador, y muestra un contador en «Pedidos». Usa Realtime y, como respaldo, consulta cada 30 segundos (`src/hooks/use-new-order-alerts.js`).
- El cliente puede cancelar hasta «Confirmado»; el negocio, hasta «Listo para recogida». Las reglas de la interfaz están en `src/lib/orderRules.js` y las definitivas en `cancel_order`.
- Eliminar un pedido solo está disponible para los ya cancelados.

## Domiciliarios: declaración y fotografía (octubre 2026)
- Firman una declaración digital (se guarda inmodificable, con su huella) y se toman una fotografía obligatoria. El cliente ve foto, nombre, documento enmascarado, placa y el mapa en tiempo real (`get_order_driver`).
- La base rechaza `accept_order` si falta cualquiera de las dos cosas.

## Mensajes entre cliente y domiciliario (noviembre 2026)
- Chat por pedido (`src/components/shared/OrderChat.jsx`, `chatService`, migración `20261015_order_chat.sql`): el cliente y el domiciliario asignado se escriben mientras el pedido está **En curso**, con respuestas rápidas («Ya llegué», «Estoy afuera»…) y aviso de mensajes sin leer.
- Reglas en la base de datos (no en la pantalla): solo escriben los dos participantes, de 1 a 500 caracteres y hasta 5 mensajes cada 10 s; al entregarse o cancelarse queda de solo lectura; la tienda no lo ve; el administrador solo lo lee si alguien **reportó** la conversación.
- Conservación: 30 días después de cerrado el pedido se borra (`purge_old_order_messages`, programada con `pg_cron`; si esa extensión no está activa en Supabase, hay que activarla y volver a ejecutar el script). Los chats con un reporte abierto se conservan hasta resolverlo. El plazo debe validarlo el abogado junto con la política de privacidad.
- Pendiente: pantalla del administrador para atender los reportes (hoy se consultan en `order_chat_reports`); el botón «Llamar» del domiciliario depende de que pueda leer el teléfono del cliente, y según las políticas del repositorio no puede (hay que verificarlo en el Supabase real).

## Calidad automática
- En cada pull request corre el CI (`.github/workflows/ci.yml`) con tres revisiones: **verificar** (lint, `npm test`, compilación y alerta de seguridad bloqueante para vulnerabilidades altas en producción), **base-de-datos** (`tools/db-test/run.sh` contra un PostgreSQL desechable) y **secretos** (búsqueda de claves subidas por error). El despliegue repite lint, pruebas y compilación.
- Dependencias de producción: 0 alertas altas (`npm audit --omit=dev`). Quedan 5 moderadas; la de `react-router` (redirección abierta con barra invertida) solo se corrige pasando a la versión 7 (migración mayor, pendiente). Mientras tanto, `src/lib/authRoutes.js` solo acepta rutas internas en `?redirect=` y rechaza `//` y `/\\`.
- Servicios con pruebas: pedidos, entrega, caja, equipo, planes, declaraciones del domiciliario, clientes (parcial), negocios (`storeService`, con un Supabase simulado en `src/services/__tests__/helpers/`) y tienda de ropa. **Sin pruebas todavía:** administración, soporte y los servicios por nicho (agro, farmacia). La autenticación vive en `src/contexts/SupabaseAuthContext.jsx` (sin pruebas propias).
- Corregido en esta etapa: la gestión de productos de la tienda de ropa y de mesas del restaurante lanzaba «Deprecated» (servicios sustitutos vacíos); ahora usan `storeService`. Las pestañas Envíos e Impuestos ya están enlazadas en el panel del negocio (solo dueño); la de Carga masiva sigue sin enlazar.
- Convenciones y flujo de trabajo: `CONTRIBUTING.md` y plantilla de pull request. Encabezados de seguridad en `vercel.json` (la política de contenido ya se **aplica**: solo scripts propios, sin `eval`, conexiones solo a la app, Supabase y el geocodificador; una prueba automática vigila que no se debilite). Se verificó en un navegador real con las rutas públicas, sin violaciones; las pantallas con sesión (mapas, cámara) se razonaron por código pero conviene recorrerlas una vez en producción. Si algo se bloquea, la consola dice qué directiva, y basta añadir ese origen en `vercel.json`. Solo aplica en Vercel: GitHub Pages no admite encabezados propios.

## Diagnóstico: la app no carga datos
Si en la consola del navegador aparecen muchos `net::ERR_FAILED` hacia `*.supabase.co`, el navegador no logra ni conectarse (no es un error de permisos ni de código). Revisar, en este orden:
1. Supabase → el proyecto no debe estar **pausado** (el plan gratuito pausa los proyectos inactivos; se reactiva con «Restore project» y se evita con un plan de pago).
2. Abrir `https://<proyecto>.supabase.co/rest/v1/` en el navegador: debe responder un JSON (aunque sea «No API key found»); si no abre, el problema es del proyecto o de la red.
3. En el hosting, que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sean los del proyecto vigente (se leen al compilar: tras cambiarlas hay que volver a desplegar).
4. Descartar bloqueadores de anuncios o filtros de red en el dispositivo.
Las pantallas de negocios, productos y turismo muestran «No pudimos cargar…» con un botón **Reintentar** cuando pasa esto (antes decían «aún no hay negocios»).

- **Ubicación del domiciliario:** solo se envía mientras está conectado Y tiene una entrega en curso (`src/hooks/use-driver-location-sharing.js`). Pendiente en la base de datos: la última posición queda guardada en `delivery_locations` al terminar; borrarla requiere revisar sus políticas en el proyecto real.

## Pendiente para comercializar
Ordenado por prioridad. Los cuatro primeros dependen de decisiones o trámites del propietario, no de código.
1. **Persona jurídica**: razón social, NIT, dirección, teléfono y correo (variables `VITE_LEGAL_*` en el hosting; hoy los Términos y la Política muestran «pendiente»).
2. **Revisión de un abogado** de los Términos, la Política de privacidad, la declaración del domiciliario, el consentimiento de la fotografía y el cumplimiento de la Ley 2466 / Decreto 0991 sobre seguridad social de repartidores. Ver `docs/NORMATIVA_COLOMBIA.md`.
3. **Pagos en línea** (Bold u otra pasarela) y cobro automático de los planes. Hoy todo es efectivo/transferencia.
4. **Supabase de pago** (copias de seguridad, sin pausa por inactividad, correos de confirmación sin límite del plan gratuito).
5. **Prueba de punta a punta con cuentas reales** (cliente, negocio, domiciliario, administrador): las pruebas actuales usan una réplica local y un Supabase simulado.
6. Cargar los primeros negocios, productos y sitios turísticos reales; confirmar precios y comisiones de los planes.
7. Monitoreo de errores y un responsable de soporte.
8. RNBD ante la SIC y consulta a la DIAN (facturación y retenciones).
9. Pruebas de los servicios restantes, consolidar `database_updates/` en una migración base y migrar `react-router` a la versión 7.
10. Consentimientos de las cuentas creadas antes de las autorizaciones (pedirlos al volver a entrar).
11. Un cupón ya no se pierde si el pedido falla (se canjea dentro de `create_order`, en la misma transacción); queda por decidir si se devuelve al cancelar un pedido.
12. Permisos del equipo más finos por tabla e invitaciones a correos sin cuenta.
