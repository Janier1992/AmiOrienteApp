# Paquete de entrega de AmiOriente

Documentación técnica para entregar el proyecto al cliente y mantenerlo después. Cada archivo indica su estado.

| # | Documento | Para qué sirve | Estado |
|---|---|---|---|
| 01 | [Guía de instalación y despliegue](01_Guia_de_instalacion_y_despliegue.md) | Levantar la app desde cero, conectarla a Supabase y publicarla | Hecha; faltan **esquema base** y **datos semilla** de producción (⚠️ en la guía) |
| 02 | [Inventario de cuentas y variables](02_Inventario_de_cuentas_y_variables.md) | Quién es dueño de qué, llaves, transferencia de cuentas | Hecha; se completan los titulares y costos |
| 03 | [Respaldos y recuperación](03_Respaldos_y_recuperacion.md) | Plan de copias y restauración | Plan hecho; **falta una restauración probada** |
| 04 | [Licencias de terceros](04_Licencias_de_terceros.md) | Qué componentes de terceros se usan y bajo qué licencia | Hecha; **react-leaflet (Hippocratic-2.1) a revisar con abogado** |

Ya existían y también forman parte de la entrega:
- `README.md` y `CONTRIBUTING.md`: estructura del proyecto y flujo de trabajo.
- `docs/ESTADO_DEL_PROYECTO.md`: estado, calidad automática y pendientes.
- `docs/NORMATIVA_COLOMBIA.md`: cumplimiento legal y qué corresponde a la persona jurídica.
- `docs/AUDITORIA_SUPABASE_2026-10-07.md` y `docs/supabase/`: auditoría de la base y scripts de verificación.
- `docs/manual-usuario/`: manual de usuario (v2).
- `tools/db-test/`: pruebas de la base de datos (`bash tools/db-test/run.sh`).

**No se guardan en este repositorio** (es público): el acta de entrega y aceptación, el contrato, los precios y cualquier
dato del cliente. Esos documentos se manejan por separado.

## Antes de entregar
1. Generar `docs/supabase/esquema_base.sql` y los datos semilla (guía 01, sección 3.1).
2. Hacer y registrar una restauración de prueba (documento 03, sección 6).
3. Completar los titulares y costos del documento 02.
4. Resolver con el abogado el punto de `react-leaflet` y la licencia del proyecto (documento 04).
5. Pasar el repositorio a privado y transferir las cuentas.
