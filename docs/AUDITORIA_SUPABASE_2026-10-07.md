# Auditoría de Supabase y desajustes código ↔ base (2026-10-07)

Fuente: resultado de `docs/supabase/02_auditoria_esquema.sql` ejecutado en el proyecto real
(37 tablas, todas con RLS activo y con al menos una política; ninguna sin RLS).
**Nada de lo de abajo está corregido todavía**: es el punto de partida para continuar.

Leyenda: 🔴 crítico · 🟠 alto · 🟡 medio · 🔵 mejora

## A. Seguridad (RLS, funciones y permisos)

| # | Sev. | Hallazgo | Evidencia | Corrección propuesta |
|---|---|---|---|---|
| 1 | 🔴 | **Cualquiera puede registrarse como administrador.** `handle_new_user` toma `role` directo de `raw_user_meta_data` (el que envía el cliente en `signUp`). Con `role: 'admin'` el perfil nace admin y `is_admin()` lo reconoce. | función `handle_new_user` | Lista blanca: solo `cliente`, `tienda`, `domiciliario`; cualquier otro valor → `cliente`. `admin` solo se asigna a mano. |
| 2 | 🔴 | **Cualquier usuario puede volverse admin editando su perfil.** Política `Users can update their own profile`: `USING (auth.uid()=id)` sin `WITH CHECK` ni límite de columnas → puede cambiar `profiles.role`. | `politicas_rls` de `profiles` | Trigger `BEFORE UPDATE` que impida cambiar `role` si no es admin (y `WITH CHECK`). |
| 3 | 🔴 | **Un cliente puede editar cualquier columna de su pedido** (`total`, `discount_amount`, `delivery_fee`, `status`…). Política `Store owners and customers can update order status`: sin `WITH CHECK`. | `orders` UPDATE | Trigger que bloquee cambios en columnas financieras y valide transiciones de estado por rol. |
| 4 | 🔴 | **`accept_order(order, driver)` es `SECURITY DEFINER` sin validar quién llama** y es ejecutable por `anon`: cualquiera puede forzar pedidos a «En curso» y crear entregas. | función `accept_order` | `REVOKE EXECUTE … FROM PUBLIC, anon`; validar `auth.uid() = delivery_person_id_to_assign` y rol `domiciliario`. |
| 5 | 🟠 | **Cualquier usuario autenticado lee todos los mensajes de contacto** (nombre, correo). Política «Allow admins to read…» usa `auth.role()='authenticated'`. | `contact_submissions` SELECT | Cambiar a `is_admin()`. |
| 6 | 🟠 | **El dueño de un negocio puede reactivar su tienda suspendida** o quitar módulos que el admin ocultó: `Store owners can update their own store` sin `WITH CHECK`. | `stores` UPDATE | Trigger que impida cambiar `status`, `disabled_modules` y `owner_id` si no es admin. |
| 7 | 🟠 | **Un miembro de tienda puede cambiar su plan/estado de suscripción** (`plan_id`, `status`) con un UPDATE directo. Hoy no cobra nada, pero será crítico al activar pagos. | `subscriptions` UPDATE | Solo admin/servicio puede modificar; el cliente solo lee. |
| 8 | 🟠 | **`redeem_discount` ejecutable por `anon`**: cualquiera puede gastar usos de cupones. | función | `REVOKE … FROM anon`; exigir sesión. |
| 9 | 🟠 | **Todos los cupones son legibles por cualquiera** (`USING (true)`, dos políticas): se pueden enumerar códigos de todas las tiendas. | `discounts` SELECT | Decisión de producto: o cupones públicos a propósito, o validar por RPC y restringir lectura a miembros de la tienda. |
| 10 | 🟡 | `deliveries` INSERT solo exige rol `domiciliario`: un domiciliario puede crear entregas a nombre de otro o «ocupar» pedidos (hay `UNIQUE(order_id)`). | `deliveries` INSERT | `WITH CHECK (delivery_person_id = auth.uid())`. |
| 11 | 🟡 | Dueños de tienda pueden actualizar **cualquier columna** de `delivery_payouts` (incluido `amount`). | `delivery_payouts` UPDATE | Trigger que solo permita cambiar `status`/`paid_at`. |
| 12 | 🟡 | `anon` y `authenticated` tienen `ALL` (incluye `TRUNCATE`, `TRIGGER`, `REFERENCES`) en todas las tablas. Es el valor por defecto de Supabase; RLS protege lectura/escritura, pero `TRUNCATE` no pasa por RLS. | `permisos_api` | `REVOKE TRUNCATE, TRIGGER, REFERENCES … FROM anon, authenticated`; quitar escritura a `anon` salvo `contact_submissions` INSERT. |
| 13 | 🟡 | El trigger de stock (`update_product_stock`) resta sin validar existencias: stock negativo / sobreventa. `products.stock` no tiene `CHECK (stock >= 0)`. | trigger + columnas | Validar en el trigger o `CHECK … NOT VALID`. Revisar que `posService` no descuente dos veces. |
| 14 | 🟡 | `order_items` permite a un cliente insertar **cualquier `price`/producto** en su pedido; `orders.total` lo fija el cliente. (El trigger de comisión sí usa `products.price`.) | `order_items` INSERT | RPC `create_order` en el servidor (ver pendiente en `ESTADO_DEL_PROYECTO.md`). |
| 15 | 🔵 | **Sin índices** salvo PK/únicos: ninguna FK ni filtro frecuente (`orders.store_id`, `orders.customer_id`, `order_items.order_id`, `products.store_id`, `deliveries.delivery_person_id`, `transactions.store_id`, …). | `indices` | `CREATE INDEX IF NOT EXISTS` (seguro). |

Lo que ya está bien: RLS activo en las 37 tablas; `wishlist` con política y único; `deliveries(order_id)`
único; `delivery_payouts(delivery_id)` único con trigger de liquidación (70 % del envío);
`profiles.email` único; `store_members(store_id,user_id)` único; funciones `is_admin` y
`is_customer_of_my_store` con `search_path` fijo; `get_store_stats` respeta RLS.

## B. Desajustes entre el código y las columnas reales (rompen funciones en producción)

Generado con `python3 tools/schema-check/check.py` (31 hallazgos). Lo más importante:

| Sev. | Dónde | Problema | Consecuencia |
|---|---|---|---|
| 🔴 | `customerService.getStores` | Ordena por `stores.is_open` (no existe); además la tarjeta usa `phone`, `image_url`, `hours`, `tags` (la tabla tiene `contact_phone`, `logo_url`). | La consulta falla, devuelve vacío y el directorio **muestra solo los negocios de ejemplo**. |
| 🔴 | `deliveryService.obtenerPedidosDisponibles` | Embebe `stores(lat, lng, phone)`: no existen. | La lista de pedidos del domiciliario **falla siempre**. |
| 🔴 | `deliveryService.aceptarEntrega` | Inserta `assigned_at` (no existe) y no envía `delivery_address` (NOT NULL). | **No se puede aceptar ningún pedido.** |
| 🔴 | `deliveryService.actualizarEstadoEntrega` | Escribe `delivered_at` y `picked_up_at` (no existen). | **No se puede completar una entrega.** |
| 🟠 | `deliveryService` (historial, estadísticas, liquidaciones) | Usa/ordena por `deliveries.delivered_at`. | Historial y ganancias vacíos. |
| 🟠 | RLS de domiciliario | Solo puede ver pedidos en `Pendiente`/`Pendiente de pago en efectivo`; **no** `Listo para recogida` (que es lo que marca la tienda), y no puede actualizar `orders`. | Aunque se arreglen las columnas, el domiciliario no ve los pedidos listos ni puede marcarlos «En curso/Entregado». |
| 🟠 | `orderService` (detalle) | Embebe `stores(phone, image_url, lat, lng)` y `deliveries(assigned_at, picked_up_at, delivered_at)`; actualiza `orders.updated_at`, `cancellation_reason`, `cancelled_at`. | Detalle de pedido y cancelación fallan. |
| 🟠 | `customerService` (pedidos) | Embebe `stores(phone, image_url)`. | Pedidos del cliente pueden fallar o venir vacíos. |
| 🟡 | `reviews` | La tabla solo tiene `spot_id` (turismo); el cliente reseña pedidos/tiendas. | Reseñas de pedidos no pueden guardarse (revisar `ReviewsTab`). |
| 🔵 | falsos positivos | `adminService:26`, `storeService:203`, `supportService:40`, `deliveryService:539` (embebidos por nombre de FK, no por tabla). | Revisar a mano; probablemente correctos. |

Decisiones a tomar al corregir (dos caminos):
1. **Agregar columnas a la base** (`stores.lat/lng/phone/image_url/is_open`, `deliveries.assigned_at/picked_up_at/delivered_at`, `orders.updated_at/cancelled_at/cancellation_reason`), o
2. **Adaptar el código** a lo que existe (`contact_phone`, `logo_url`, `created_at`…).
Recomendado: lo más simple y consistente (p. ej. agregar los 3 timestamps de `deliveries` y `orders.updated_at`;
usar `contact_phone`/`logo_url` en el código; coordenadas de la tienda solo si se va a mostrar mapa).

## C. Plan sugerido (en este orden)
1. **Seguridad crítica** (A1–A4): una migración transaccional y probada contra una réplica local con roles `anon`/`authenticated` (funciona bien con PostgreSQL 16 + el esquema de esta auditoría).
2. **Flujo del domiciliario** (B + RLS): columnas/código + políticas + funciones `SECURITY DEFINER` con validación para aceptar/entregar.
3. **Directorio de negocios** (`getStores`) y detalle/cancelación de pedidos.
4. Resto de la sección A (5–15) y `create_order` en el servidor.
5. Probar de punta a punta en un proyecto Supabase **de pruebas** (no en producción) antes de comercializar.
