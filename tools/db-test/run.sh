#!/usr/bin/env bash
# Pruebas de migraciones de seguridad contra una réplica local del esquema.
#
# Requisitos: un PostgreSQL local accesible con psql (variables PGHOST, PGPORT,
# PGUSER; el usuario debe poder crear bases y roles).
# Uso:  bash tools/db-test/run.sh
#
# 1) Base "antes": réplica vulnerable -> los ataques DEBEN funcionar (prueba que el
#    ataque es real).
# 2) Base "después": réplica + migración (aplicada dos veces: idempotente) -> los
#    ataques DEBEN fallar y los flujos legítimos seguir funcionando.
set -u
cd "$(dirname "$0")/../.."
DIR=tools/db-test
MIGRATIONS="database_updates/20261008_security_critical_fixes.sql database_updates/20261008_delivery_status_rpc.sql database_updates/20261009_teams_plans_commissions.sql database_updates/20261010_legal_consents.sql database_updates/20261011_driver_declarations.sql"
PSQL="psql -q -v ON_ERROR_STOP=0"
fails=0

for phase in before after; do
  db="amio_$phase"
  $PSQL -d postgres -c "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db" >/dev/null 2>&1
  $PSQL -d "$db" -v ON_ERROR_STOP=1 -f "$DIR/replica.sql" >/dev/null || { echo "Error cargando la réplica"; exit 2; }
  if [ "$phase" = after ]; then
    for m in $MIGRATIONS; do
      $PSQL -d "$db" -v ON_ERROR_STOP=1 -f "$m" >/dev/null || { echo "Error aplicando $m"; exit 2; }
      $PSQL -d "$db" -v ON_ERROR_STOP=1 -f "$m" >/dev/null || { echo "$m no es idempotente"; exit 2; }
    done
    attack=false; after=true; titulo="DESPUÉS de la migración (ataques bloqueados)"
  else
    attack=true; after=false; titulo="ANTES de la migración (ataques funcionan = vulnerabilidad real)"
  fi
  echo; echo "################ $titulo ################"
  out=$($PSQL -d "$db" -v attack=$attack -v after=$after -f "$DIR/test_security_critical.sql" 2>&1)
  echo "$out" | sed -n '/RESULTADO/,$p'
  n=$(echo "$out" | grep -E "^\s+[0-9]+ \| FAIL" | wc -l); fails=$((fails + n))
done
echo; [ "$fails" -eq 0 ] && echo "TODO OK" || echo "$fails PRUEBAS FALLARON"
exit $((fails > 0))
