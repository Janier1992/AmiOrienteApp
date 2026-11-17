# Guía de instalación y despliegue de AmiOriente

Para quien reciba el proyecto (el cliente o su proveedor técnico). Explica cómo levantar la app desde el código,
cómo conectarla a su base de datos, cómo publicarla y cómo comprobar que quedó bien.

> **Estado de esta guía.** Los pasos de la sección 2 (ejecutar en local), 4 (publicar) y 5 (comprobar) están
> verificados contra el proyecto actual. La sección 3 (base de datos en un proyecto **nuevo**) tiene dos
> puntos pendientes marcados con ⚠️; hasta resolverlos no se ha probado una instalación desde cero.

## 1. Qué es y qué necesita

AmiOriente es una aplicación web instalable (PWA) hecha con React y Vite, que usa **Supabase** como base de datos,
autenticación y tiempo real. No tiene servidor propio: el navegador habla directamente con Supabase, y la seguridad
la dan las políticas de acceso por filas (RLS) de la base de datos.

| Necesita | Detalle |
|---|---|
| Node.js | **20.19.1** (archivo `.nvmrc`) y npm |
| Cuenta de Supabase | Un proyecto de **pago** en producción (el plan gratuito se pausa por inactividad) |
| Hosting estático | Vercel (el actual), GitHub Pages o un servidor propio con Nginx/Caddy |
| Dominio | Opcional, pero recomendado; hay que registrarlo en Supabase (ver 3.3) |
| Git | Para clonar el repositorio |

## 2. Ejecutarla en local

```bash
git clone <URL-del-repositorio> && cd AmiOrienteApp
nvm use            # toma la versión de .nvmrc
npm ci             # instala las dependencias exactas de package-lock.json
cp .env.example .env
# edita .env: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver 02_Inventario_de_cuentas_y_variables.md)
npm run dev        # http://localhost:3000
```

Otros comandos: `npm run build` (genera `dist/`), `npm run preview` (sirve `dist/`), `npm run lint`, `npm test`.
La app usa `HashRouter` (las rutas van tras `#/`), por eso funciona en cualquier carpeta o servidor estático sin
reglas de reescritura.

**Cuidado:** `npm run dev` usa la base a la que apunte tu `.env`. No lo apuntes a producción para hacer pruebas.

## 3. Base de datos (Supabase)

### 3.1 Esquema
Los cambios están como scripts SQL en `database_updates/` (41 archivos, con la fecha en el nombre) y se ejecutan **en
orden** en *Supabase → SQL Editor*. Copia el archivo completo y ejecútalo de una vez: el editor no admite `BEGIN`/`COMMIT`
en los scripts recientes (ya fueron escritos sin ellos).

Para saber qué migraciones están aplicadas en un proyecto existente, ejecuta `docs/supabase/03_verificar_migraciones.sql`:
debe devolver **11 filas con `true`**.

⚠️ **Pendiente 1: esquema base.** Las migraciones parten de un esquema ya existente (tablas `profiles`, `stores`,
`orders`, `products`, etc.); **ese esquema base no está guardado en el repositorio**. Para crear un proyecto nuevo hay
que exportarlo desde producción y guardarlo:

```bash
# con la CLI de Supabase y la cadena de conexión del proyecto de producción
supabase db dump --schema public -f docs/supabase/esquema_base.sql
```

Con ese volcado, un proyecto nuevo se crea **restaurando el esquema actual**, no repitiendo las 41 migraciones.

⚠️ **Pendiente 2: datos semilla.** Algunas tablas necesitan filas iniciales (por ejemplo `service_categories` y
`plans`). También deben exportarse de producción (`supabase db dump --data-only -t public.service_categories -t public.plans`).

### 3.2 Almacenamiento de imágenes
La app sube imágenes de productos al *bucket* **`product-images`** de Supabase Storage. Ninguna migración lo crea:
hay que crearlo a mano (*Storage → New bucket*, **público**) y permitir que los usuarios con sesión suban archivos.
Si falta, la carga de fotos de productos falla.

### 3.3 Autenticación
En *Authentication → URL Configuration*:
- **Site URL:** la dirección pública de la app (por ejemplo `https://app.tudominio.co`).
- **Redirect URLs:** cada dirección desde la que se use la app (producción, vista previa, local). Si falta alguna, los
  enlaces de confirmación de correo y de recuperación de contraseña no funcionan.
- **Correo (SMTP):** el servicio incluido de Supabase tiene un límite bajo; para producción configura un SMTP propio.

### 3.4 Extensiones y tiempo real
- Activar **`pg_cron`** (*Database → Extensions*) y volver a ejecutar `20261015_order_chat.sql` y
  `20261017_driver_contact_and_location.sql`: programan el borrado del chat a los 30 días y la limpieza horaria de ubicaciones.
- Las migraciones agregan `orders`, `order_messages` y `delivery_locations` a la publicación de **Realtime**. Verifícalo
  con las consultas del final de cada script.

### 3.5 Primer administrador
El registro público nunca crea administradores (está probado). Para crear el primero, registra la cuenta normalmente y
luego, en el SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'correo-del-administrador@ejemplo.co';
```

## 4. Publicar la app

### 4.1 Vercel (hoy en uso)
1. *Add New → Project* e importa el repositorio.
2. **Framework:** Vite. **Build command:** `npm run build`. **Output:** `dist`.
3. En *Settings → Environment Variables* define las variables del inventario (02), sobre todo `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` y las `VITE_LEGAL_*`. **No** definas `VITE_DEMO_MODE`.
4. El archivo `vercel.json` agrega los encabezados de seguridad y la **política de contenido (CSP)**.
5. *Domains:* agrega el dominio propio y crea en el DNS los registros que Vercel indique.
6. Vuelve a 3.3 y registra el dominio en Supabase.

Nota: el plan gratuito de Vercel (Hobby) es para uso no comercial; con un cliente en producción corresponde el plan Pro.

### 4.2 GitHub Pages (alternativa)
`.github/workflows/deploy.yml` publica en cada `push` a `main`. Requiere los *secrets* `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` y las *variables* `VITE_LEGAL_*`. **Sus encabezados de seguridad no se aplican** (Pages no los
admite). Conviene dejar un solo destino de despliegue.

### 4.3 Servidor propio (futuro)
Se sirve la carpeta `dist/` con Nginx o Caddy. Hay que **trasladar a mano los encabezados de `vercel.json`** (incluida la
CSP) a la configuración del servidor; si no, la app queda sin esa protección. Si se cambia el origen de las teselas del
mapa o del geocodificador, hay que añadirlo a `img-src` / `connect-src`.

## 5. Comprobar que quedó bien

Con la app publicada y una base limpia o de pruebas:
1. Abre la portada: carga sin errores en la consola (F12 → Console).
2. Registra un **cliente**, un **negocio** y un **domiciliario** (cada uno por su registro).
3. Como negocio: crea un producto y sube una foto (prueba el bucket de 3.2).
4. Como cliente: haz un pedido; el negocio debe recibir el aviso en pantalla y por sonido.
5. Como domiciliario: firma la declaración, toma la foto, acepta el pedido, abre **Mensajes** y **Llamar**.
6. Como administrador: entra a `/#/admin`; debe verse la lista de negocios, declaraciones, soporte y reportes de chat.
7. Cierra el pedido como entregado: el chat queda de solo lectura.
8. Revisa la consola: **no** debe haber mensajes de «Content Security Policy». Si aparece uno, indica qué origen se bloqueó.

## 6. Publicar cambios (flujo de trabajo)
1. Rama nueva desde `main` y cambios pequeños.
2. Antes de subir: `npm run lint`, `npm test`, `npm run build` (y `bash tools/db-test/run.sh` si tocaste SQL).
3. *Pull request*: el CI corre **verificar** (lint, pruebas, build), **base-de-datos** (pruebas SQL contra PostgreSQL 16)
   y **secretos** (busca llaves subidas por error). Se fusiona solo con los tres en verde.
4. Al fusionar a `main`, el hosting despliega solo.
5. Si el cambio incluye SQL, ejecútalo en Supabase **antes o junto con** el despliegue, y corre `03_verificar_migraciones.sql`.

Convenciones completas en `CONTRIBUTING.md`.

## 7. Problemas frecuentes
| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Muchos `net::ERR_FAILED` hacia `*.supabase.co` | Proyecto de Supabase **pausado** (plan gratuito) o bloqueo de red | *Restore project* en Supabase; pasar a un plan de pago |
| Correos de confirmación o recuperación no llegan o llevan a una dirección vieja | Falta la URL en *Redirect URLs* o el SMTP es el de prueba | Revisar 3.3 |
| El mapa no carga o aparece en gris | Origen de teselas bloqueado por la CSP o por el proveedor | Revisar `vercel.json` y las variables `VITE_MAP_*` |
| «No pudimos cargar…» con botón Reintentar | La base respondió con error | Mirar la consola y el estado de Supabase |
| La subida de fotos falla | Falta el bucket `product-images` o sus permisos | Ver 3.2 |
| El botón «Llamar» está deshabilitado | Falta aplicar `20261017_driver_contact_and_location.sql` | Aplicarla (3.1) |

Más detalle del estado del proyecto en `docs/ESTADO_DEL_PROYECTO.md`.
