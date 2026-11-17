# Inventario de cuentas, servicios y variables

Quién es dueño de qué, cuánto cuesta, dónde viven las llaves y cómo se transfiere. **No contiene contraseñas ni llaves**:
las columnas «Titular hoy» y «Titular al entregar» se completan con nombres de personas o empresas, y las llaves se guardan
en un gestor de contraseñas, nunca en el repositorio.

## 1. Servicios que usa la plataforma

| Servicio | Para qué sirve | Plan recomendado | Titular hoy | Titular al entregar | Costo mensual |
|---|---|---|---|---|---|
| **Supabase** | Base de datos, autenticación, tiempo real, archivos | De pago (Pro): respaldos y sin pausa por inactividad | [completar] | Cliente | [completar] |
| **Vercel** | Hosting de la app y encabezados de seguridad | Pro (el gratuito es no comercial) | [completar] | Cliente | [completar] |
| **GitHub** | Código, CI, Dependabot | Cuenta de la organización del cliente | Janier1992/AmiOrienteApp | Cliente | [completar] |
| **Dominio** | Dirección propia de la app | Registrado a nombre de la empresa | [pendiente de comprar] | Cliente | [completar] |
| **Correo (SMTP)** | Confirmación de cuenta y recuperación de contraseña | Proveedor propio (el de Supabase tiene límite bajo) | [pendiente] | Cliente | [completar] |
| **Pasarela de pagos** | Cobros en línea (Bold o Wompi) | Cuenta de la persona jurídica | [pendiente] | Cliente | Comisión por transacción |
| **Monitoreo de errores** | Enterarse de fallos antes que los usuarios | Cuenta externa a nombre del cliente | [pendiente] | Cliente | [completar] |
| **Mapas (teselas)** | Mapas de seguimiento y turismo | Hoy OpenStreetMap público; en producción, proveedor comercial o propio | [pendiente] | Cliente | [completar] |
| **Geocodificador** | Nombre del municipio por ubicación | Hoy Nominatim público; en producción, servicio propio o comercial | [pendiente] | Cliente | [completar] |
| **Google Fonts** | Tipografía Inter (se carga desde `fonts.googleapis.com`) | Gratuito; opcional alojarla en la propia app | — | — | 0 |

## 2. Variables de entorno

Todas son de **construcción** (`VITE_*`): quedan dentro del código que descarga el navegador, así que **son públicas**.
No se guardan aquí secretos reales. Se definen en Vercel (*Settings → Environment Variables*) y, si se usa GitHub Pages, en
GitHub (*Settings → Secrets and variables → Actions*).

| Variable | ¿Obligatoria? | Qué es | Dónde se define |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Sí | Dirección del proyecto de Supabase | Vercel / GitHub *secret* |
| `VITE_SUPABASE_ANON_KEY` | Sí | Llave pública «anon» de Supabase (es pública por diseño: la seguridad la dan las políticas RLS) | Vercel / GitHub *secret* |
| `VITE_LEGAL_NAME` | Sí, antes de comercializar | Razón social | Vercel / GitHub *variable* |
| `VITE_LEGAL_NIT` | Sí | NIT | ídem |
| `VITE_LEGAL_ADDRESS` | Sí | Dirección | ídem |
| `VITE_LEGAL_PHONE` | Sí | Teléfono | ídem |
| `VITE_LEGAL_EMAIL` | Sí | Correo para datos personales y contacto | ídem |
| `VITE_MAP_TILE_URL` | No | Plantilla de teselas del proveedor de mapas | Vercel |
| `VITE_MAP_TILE_ATTRIBUTION` | No (sí si se cambia el proveedor) | Atribución que exige el proveedor | Vercel |
| `VITE_GEOCODER_URL` | No | Servicio de geocodificación inversa | Vercel |
| `VITE_DEMO_MODE` | **Nunca en producción** | Rellena listados vacíos con datos de ejemplo | Solo en presentaciones |

Si se cambia el origen de las teselas o del geocodificador hay que añadir su dominio a `img-src` / `connect-src` de `vercel.json`.

### Reglas para las llaves
- La llave **`service_role` de Supabase nunca** va en el frontend ni en el repositorio: salta las políticas de seguridad.
- Las llaves de la pasarela de pagos y del SMTP son **secretas**: viven en el servidor o en la configuración del proveedor,
  nunca en variables `VITE_*`. Los cobros necesitan una parte de servidor (por ejemplo, funciones de Supabase) para recibir
  las confirmaciones de la pasarela.
- Si una llave secreta se expone, se **revoca y rota** de inmediato y se revisa dónde pudo quedar copiada.
- El CI incluye una búsqueda de secretos (gitleaks) en cada pull request.

## 3. Transferencia de cuentas (orden recomendado)

Hacerla el día del pago final y dejar constancia en el acta de entrega.

1. El cliente crea (o confirma) sus cuentas de **Supabase, Vercel, GitHub y dominio** con un correo corporativo y verificación
   en dos pasos activada.
2. Se agrega al cliente como **propietario** (Owner) de cada una. **Aún no se retira al proveedor.**
3. Se transfiere el proyecto de Vercel y el repositorio de GitHub; se mueve o recrea el proyecto de Supabase (la transferencia
   de organización es posible en Supabase; confirmar el procedimiento vigente en su documentación antes de hacerla).
4. El cliente comprueba que puede **desplegar un cambio** y **entrar a la base de datos**.
5. Se rotan las llaves (anon y las de terceros) y se actualizan las variables.
6. Solo entonces el proveedor deja de ser propietario y, si hay plan de soporte, queda como **colaborador** con permisos limitados.
7. Se entrega el listado de personas con acceso (administradores de la plataforma, colaboradores) y sus roles.

## 4. Datos personales y accesos
- Los administradores de la plataforma ven datos de otros usuarios: cuenta personal, contraseña única y cierre de sesión.
- La lista de quién tiene acceso a Supabase, Vercel y GitHub se revisa **cada trimestre** y cuando alguien deja el equipo.
