## Qué cambia y por qué
<!-- Resumen breve. Si es un cambio de base de datos, indica qué migración se debe aplicar y en qué orden. -->

## Cómo se verificó
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Si toca la base de datos: `bash tools/db-test/run.sh` y la migración es idempotente
- [ ] Si toca la interfaz: revisado en celular y en computador

## Revisión final
- [ ] Cumple el objetivo y respeta la arquitectura y las convenciones del repositorio
- [ ] Nombres y responsabilidades claros; sin duplicación ni complejidad innecesaria
- [ ] Errores y entradas inválidas manejados; los mensajes al usuario no revelan datos internos
- [ ] Sin secretos, claves ni datos personales en el código, los registros o los ejemplos
- [ ] Pruebas nuevas o ajustadas proporcionales al riesgo
- [ ] Documentación afectada actualizada (`README.md`, `docs/`)
- [ ] El cambio no incluye archivos temporales ni cambios ajenos

## Riesgos y pendientes
<!-- Lo que no se pudo verificar, supuestos y siguientes pasos. -->
