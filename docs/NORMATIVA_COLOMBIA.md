# Cumplimiento normativo (Colombia): qué hace la plataforma y qué le corresponde a la persona jurídica

> **Aviso.** Este documento y los textos legales de la app (Términos, Política de Privacidad) son una **base técnica
> y jurídica de partida**, elaborada con fuentes públicas. **No sustituyen la revisión de un abogado.** La persona
> jurídica que opere la plataforma debe validarlos y completarlos antes de comercializar.

Versión de los textos: ver `LEGAL_VERSION` en `src/config/legal.js`.

## 1. Modelo asumido
- La plataforma es un **intermediario tecnológico**; el vendedor es cada negocio aliado.
- Los **domiciliarios actúan como trabajadores independientes**. El cliente paga el domicilio, que va dentro del valor total del pedido.
- La plataforma será **entregada a una persona jurídica** que responde por el cumplimiento regulatorio.

## 2. Qué ya está implementado en la app
| Tema | Norma de referencia | Qué se hizo |
|---|---|---|
| Datos personales | Ley 1581 de 2012; Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) | Política de Privacidad y Tratamiento (`/privacidad`): responsable, datos, finalidades, derechos, plazos (consultas 10 días hábiles, reclamos 15), transferencias, seguridad. |
| Autorización | Ley 1581, arts. 9 y 17 | Casilla obligatoria en los 3 registros (cliente, negocio, domiciliario). El servidor guarda **qué documento, qué versión y cuándo** aceptó cada persona (`legal_consents`, migración `20261010_legal_consents.sql`). |
| Derechos del titular | Ley 1581, arts. 8, 14 y 15 | Formulario `/datos-personales` (consulta, actualización, supresión, prueba de autorización, reclamo); llega al administrador con el prefijo «[Datos personales]». |
| Consumidor | Ley 1480 de 2011 (retracto 5 días hábiles, identificación del proveedor, información clara) | Términos y Condiciones (`/terminos`) con retracto, excepciones, garantías y PQRS; el checkout informa que el total incluye el domicilio. |
| Domiciliarios | Ley 2466 de 2025 y su reglamentación | Términos: trabajador independiente y autónomo, sin subordinación; deber de estar afiliado a salud, pensión y riesgos laborales. **Declaración y compromiso firmados digitalmente** al registrarse (ver sección 2.1). |
| Datos de la persona jurídica | Ley 1480, art. 50 | Razón social, NIT, dirección, teléfono y correo se leen de variables `VITE_LEGAL_*` y se muestran en Términos, Privacidad, Solicitudes y Contacto. Mientras falten salen resaltados como **[POR DEFINIR]**. |

### 2.1 Declaración firmada del domiciliario (soporte para administración)
En el registro el domiciliario completa y **firma digitalmente** (firma dibujada + aceptación expresa) un documento con: tipo y número de documento, medio de transporte, placa, licencia de conducción, SOAT y revisión técnico-mecánica (con vencimientos, que deben estar vigentes), EPS, pensión y ARL, y seis declaraciones «bajo la gravedad del juramento» (independencia, medios propios, documentos veraces y vigentes, afiliación a seguridad social, deber de informar cambios, autorización de verificación).
- Se guarda en `driver_declarations` (migración `20261011_driver_declarations.sql`): datos, **texto exacto firmado**, imagen de la firma, fecha, versión de los Términos y **huella SHA-256** para detectar alteraciones. **Es inmodificable** desde la API y solo lo ven administración y el propio domiciliario.
- Administración lo consulta en el Panel de Administración → «Declaraciones de domiciliarios» (búsqueda, ver documento, imprimir o guardar como PDF).
- Los domiciliarios que ya tenían cuenta ven un aviso en su panel y deben firmarla para aceptar pedidos.
- **A validar con el abogado:** la fórmula «bajo la gravedad del juramento», el valor probatorio de la firma electrónica manuscrita digitalizada (Ley 527 de 1999 y Decreto 2364 de 2012, citados sin verificar contra el texto vigente) y si conviene añadir verificación de identidad adicional (por ejemplo, código al correo o foto del documento).
- **Fotografía obligatoria (regla de la plataforma):** el domiciliario se toma una foto con la cámara al registrarse (también puede hacerlo después desde su panel). El **cliente de cada pedido** que atienda ve su **foto, nombre completo, documento enmascarado (solo los últimos 4 dígitos) y placa**, junto al rastreo en tiempo real; la tienda del pedido y administración también lo ven. Nadie más. Migración `20261013_driver_photo.sql`.
  - **Decisión de privacidad:** el documento se muestra enmascarado, no completo. Mostrar el número completo a cada cliente contradice el principio de necesidad y finalidad de la Ley 1581 y aumenta el riesgo de suplantación o acoso; si se quiere mostrar completo hay que cambiar `get_order_driver` y debería validarlo el abogado.
  - **La foto facial es un dato biométrico = dato sensible** (Ley 1581, art. 5 y 6): solo con autorización expresa, previa e informada, y el titular puede negarse. Por eso va como declaración específica en el documento firmado y está en la Política de Privacidad; como es indispensable para operar, el texto lo advierte. **A validar con el abogado** (si basta la autorización o conviene un consentimiento separado).
  - `accept_order` exige declaración firmada **y** foto.
- La base de datos también lo exige: `accept_order` rechaza a quien no tenga declaración firmada (migración `20261012_accept_order_requires_declaration.sql`). Si la interfaz no lo sabía, abre el formulario de firma.

## 3. ⚠️ Punto que NO coincide con el modelo asumido (decidir con el abogado)
La Ley 2466 de 2025 (art. 27) asigna, para repartidores **independientes** de plataformas, **60 % de salud y pensión a la plataforma, 40 % al repartidor, y 100 % de riesgos laborales a la plataforma**. El **Decreto 0991 de 2026** (4 de agosto de 2026) obliga a las plataformas a **afiliar, retener y pagar** esos aportes por la PILA, con **12 meses** para adecuar sistemas, y aclara que no crea subordinación. El gremio Alianza In anunció demanda y pidió derogarlo: **su estado actual está sin verificar** (hasta ahora hay dos fuentes que dan el número de forma distinta, 0991 y 099).
Por eso los Términos dicen que el domiciliario debe estar afiliado **y** que la plataforma cumplirá los aportes que la ley ponga a su cargo. Si el criterio es que el domiciliario asuma todo, hay que ponerlo por escrito con respaldo jurídico, porque hoy la ley dice otra cosa.
**Pendiente técnico:** módulo que registre el ingreso de cada domiciliario por la plataforma y calcule la base de cotización (40 % de los ingresos) y los aportes, cuando el decreto quede en firme.

## 4. Lista de pendientes para la persona jurídica (antes de comercializar)
0. Aplicar en Supabase `20261011_driver_declarations.sql`, `20261012_accept_order_requires_declaration.sql` y `20261013_driver_photo.sql`. Los domiciliarios que ya existían deben firmar desde su panel antes de volver a aceptar pedidos.
1. Completar las variables de GitHub (Settings → Secrets and variables → Actions → **Variables**): `VITE_LEGAL_NAME`, `VITE_LEGAL_NIT`, `VITE_LEGAL_ADDRESS`, `VITE_LEGAL_PHONE`, `VITE_LEGAL_EMAIL`. Volver a desplegar.
2. Aplicar en Supabase la migración `database_updates/20261010_legal_consents.sql`.
3. Que un abogado revise Términos y Privacidad (y suba `LEGAL_VERSION` si cambia algo).
4. Verificar si debe **inscribir la base de datos en el RNBD** de la SIC y fijar el calendario (no se pudo confirmar).
5. Definir cómo cumplirá la Ley 2466 y el Decreto 0991 (sección 3) con los domiciliarios.
6. Facturación electrónica y obligaciones tributarias de la comisión y de la suscripción (DIAN).
7. Que cada negocio informe razón social y NIT (hoy la app solo guarda nombre y dirección del negocio).
8. Mecanismo de **reversión de pago** y retracto cuando existan pagos en línea (Decreto 587 de 2016).
9. Aviso de privacidad y política también disponibles fuera de la app (por ejemplo, en el dominio propio).
10. Pedir de nuevo la autorización a las cuentas creadas **antes** de esta versión (hoy no tienen registro en `legal_consents`).

## 5. Fuentes consultadas
- Ley 2466 de 2025 y Decreto 0991 de 2026: [texto](https://normativa.colpensiones.gov.co/compilacion/docs/decreto_0991_2026.htm), [Cerlatam](https://www.cerlatam.com/normatividad/minsalud-decreto-991-de-2026-04-ago-26/), [Fenalco](https://www.fenalco.com.co/blog/juridico-2/notijuridico-092-mintrabajo-reglamenta-la-afiliacion-cotizacion-reporte-y-pago-de-aportes-al-sistema-de-seguridad-social-integral-para-los-trabajadores-digitales-de-servicios-de-reparto-9056), [Portafolio](https://www.portafolio.co/tecnologia/nuevo-decreto-de-petro-pondria-en-jaque-a-las-plataformas-de-domicilios-alianza-in-499884).
- Ley 1480 de 2011 (conceptos SIC): [concepto](https://www.ambitojuridico.com/sites/default/files/BancoMedios/Archivos/cpto-19000458-19.pdf).
