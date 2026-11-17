# Plan de respaldos y recuperación

> **Estado.** Este es el plan. **Todavía no hay una restauración probada**: hasta que se haga una y se anote en la sección 6,
> no se puede afirmar que existan respaldos utilizables. Las metas de la sección 2 son una propuesta a acordar con el cliente.

## 1. Qué hay que proteger

| Dato | Dónde vive | Cómo se respalda |
|---|---|---|
| **Base de datos** (pedidos, usuarios, negocios, productos, declaraciones, mensajes…) | Supabase (PostgreSQL) | Respaldo del plan de Supabase **y** copia propia con `pg_dump` (sección 3) |
| **Usuarios y contraseñas** | Esquema `auth` de Supabase | Va incluido en el volcado de la base; en una restauración conviene hacerla en el mismo proyecto |
| **Imágenes de productos** | Supabase Storage, bucket `product-images` | Copia periódica de los archivos del bucket (sección 3.3) |
| **Código** | GitHub | El historial de Git; la copia del cliente es su propio repositorio |
| **Configuración** (variables, dominio, DNS) | Vercel y el registrador del dominio | Anotada en `02_Inventario_de_cuentas_y_variables.md` |

## 2. Metas propuestas
- **RPO** (cuántos datos se pueden perder): **24 horas** como máximo.
- **RTO** (cuánto tarda en volver a funcionar): **4 horas** en horario hábil.
- Retención de copias propias: **30 días**, con una copia mensual guardada **un año**.

## 3. Cómo se respalda

### 3.1 Respaldo del proveedor
Los planes de pago de Supabase incluyen respaldos diarios automáticos; la retención y la recuperación a un punto exacto
(PITR) dependen del plan y del complemento contratado. **Confirmar en la página de precios y en el panel de Supabase** lo que
incluye el plan del cliente. El plan gratuito no debe usarse en producción.

### 3.2 Copia propia de la base (fuera de Supabase)
Una copia que no dependa del mismo proveedor protege ante una cuenta suspendida o un error de borrado.

```bash
# 1. Cadena de conexión: Supabase → Project Settings → Database → Connection string (use el "pooler" si hay límite de conexiones)
export DATABASE_URL='postgresql://postgres:[CLAVE]@[HOST]:5432/postgres'

# 2. Volcado comprimido, con fecha
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges -f "amioriente_$(date +%F).dump"

# 3. Cifrar antes de moverlo (contiene datos personales)
gpg --symmetric --cipher-algo AES256 "amioriente_$(date +%F).dump"

# 4. Subir a un almacenamiento externo (otro proveedor) y borrar el archivo sin cifrar
```

Se programa **cada día** (cron de un servidor del cliente o una acción programada de GitHub). La clave de la base y la de
cifrado se guardan en un gestor de contraseñas, **no** en el repositorio.

### 3.3 Imágenes
Copia periódica (semanal) del bucket `product-images` con la CLI de Supabase o con la API de Storage, hacia el mismo
almacenamiento externo.

## 4. Cómo se restaura

1. **No restaurar encima de producción.** Crear un proyecto de Supabase vacío (o uno de pruebas).
2. Descifrar y restaurar: `pg_restore --no-owner --clean --if-exists -d "$DATABASE_URL_NUEVO" amioriente_AAAA-MM-DD.dump`.
3. Crear el bucket `product-images` (público) y volver a subir las imágenes.
4. Ejecutar `docs/supabase/03_verificar_migraciones.sql`: deben salir **11 filas con `true`**.
5. Comprobar conteos básicos frente a producción (usuarios, negocios, pedidos del último mes).
6. Activar `pg_cron` y comprobar que siguen programados el borrado de chats y la limpieza de ubicaciones.
7. Si se va a **sustituir** producción: cambiar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, volver a desplegar y actualizar las
   *Redirect URLs* de Autenticación.

## 5. Si pasa algo (guía rápida)

| Situación | Qué hacer |
|---|---|
| La app no carga y hay `net::ERR_FAILED` | Revisar si el proyecto de Supabase está **pausado**; *Restore project* |
| Se borraron datos por error | Parar escrituras si es posible; restaurar a un proyecto nuevo (sección 4) y recuperar solo las filas afectadas |
| Se filtró una llave | Revocar y rotar la llave de inmediato (`service_role`, SMTP, pasarela); revisar los registros de acceso; si hay datos personales expuestos, **informar a la SIC** (Ley 1581, art. 17 lit. n; confirmar plazo con el abogado) |
| Vercel no responde | Publicar `dist/` en otro hosting estático (GitHub Pages u otro) y apuntar el dominio |
| Se perdió el dominio | Recuperarlo desde el registrador; por eso debe estar a nombre de la empresa y con renovación automática |
| Falló un despliegue | Volver al despliegue anterior en Vercel (*Deployments → Promote*) |

## 6. Registro de pruebas de restauración

Hacer una cada **trimestre** y antes de la entrega. Una restauración no probada no cuenta como respaldo.

| Fecha | Quién | Copia usada | Tiempo que tardó | Resultado de `03_verificar` | Observaciones |
|---|---|---|---|---|---|
| [pendiente: prueba previa a la entrega] | | | | | |

## 7. Datos personales en las copias (Ley 1581 de 2012)
- Las copias contienen datos personales (incluidos fotos y declaraciones de domiciliarios, datos sensibles): **cifrarlas**,
  limitar quién accede y registrar los accesos.
- La política de conservación de la plataforma borra los mensajes del chat 30 días después de cerrado el pedido; las copias
  anteriores pueden conservarlos más tiempo. El tiempo de retención de las copias debe acordarse con el abogado para que sea
  coherente con la Política de Privacidad.
- Si un titular pide la supresión de sus datos, definir cómo se atiende respecto de las copias ya hechas.
