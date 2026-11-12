#!/usr/bin/env bash
# Pruebas de las migraciones contra la IMAGEN OFICIAL de PostgreSQL de Supabase (la misma que usa el Supabase
# autoalojado en el VPS), en lugar del PostgreSQL genérico de run.sh. Detecta diferencias reales: esquema `auth`,
# roles, permisos por defecto de `anon`/`authenticated`, publicación de Realtime y la extensión pg_cron.
#
# Requisitos: Docker y psql. Uso:  bash tools/db-test/run-supabase.sh
# Variables: SUPABASE_PG_IMAGE (por defecto la versión fijada abajo), PUERTO (por defecto 54330).
set -u
cd "$(dirname "$0")/../.."
IMAGEN="${SUPABASE_PG_IMAGE:-supabase/postgres:17.6.1.136}"
PUERTO="${PUERTO:-54330}"
CONTENEDOR="amio_supabase_pg_test"
export PGPASSWORD="pruebas-locales"
PSQL="psql -h 127.0.0.1 -p $PUERTO -U supabase_admin -d postgres -q"

command -v docker >/dev/null || { echo "Falta Docker"; exit 2; }
trap 'docker rm -f "$CONTENEDOR" >/dev/null 2>&1' EXIT
docker rm -f "$CONTENEDOR" >/dev/null 2>&1
docker run -d --name "$CONTENEDOR" -e POSTGRES_PASSWORD="$PGPASSWORD" -p "127.0.0.1:$PUERTO:5432" "$IMAGEN" >/dev/null || { echo "No se pudo iniciar $IMAGEN"; exit 2; }

echo "Esperando a PostgreSQL ($IMAGEN)..."
for _ in $(seq 1 60); do
  $PSQL -c "select 1" >/dev/null 2>&1 && break
  sleep 2
done
$PSQL -c "select 1" >/dev/null 2>&1 || { echo "PostgreSQL no respondió a tiempo"; exit 2; }

# 1) Esquema base: la réplica sin el andamiaje (roles, esquema auth y publicación ya existen en la imagen oficial).
sed -n '/^-- -* tablas/,$p' tools/db-test/replica.sql | sed 's/^CREATE PUBLICATION supabase_realtime;/-- (ya existe en la imagen oficial)/' \
  | $PSQL -v ON_ERROR_STOP=1 -f - || { echo "Error cargando el esquema base"; exit 2; }

# 2) pg_cron antes de las migraciones, para que programen sus trabajos como en producción.
$PSQL -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pg_cron" || { echo "No se pudo crear pg_cron"; exit 2; }

# 3) Migraciones (las mismas que run.sh), cada una dos veces: debe ser idempotente.
MIGRACIONES=$(grep '^MIGRATIONS=' tools/db-test/run.sh | head -1 | sed 's/^MIGRATIONS="//; s/"$//')
for m in $MIGRACIONES; do
  for vuelta in 1 2; do
    $PSQL -v ON_ERROR_STOP=1 -f "$m" >/dev/null 2>&1 || { echo "Error aplicando $m (vuelta $vuelta)"; exit 2; }
  done
done
echo "Migraciones aplicadas dos veces cada una: $(echo "$MIGRACIONES" | wc -w)"

# 4) Trabajos programados con pg_cron.
trabajos=$($PSQL -At -c "select count(*) from cron.job where jobname in ('purge-order-messages','clear-idle-driver-locations')")
echo "Trabajos de pg_cron programados: $trabajos de 2"

# 5) Las mismas pruebas de seguridad y de flujos.
salida=$($PSQL -v ON_ERROR_STOP=0 -v attack=false -v after=true -f tools/db-test/test_security_critical.sql 2>&1)
echo "$salida" | sed -n '/RESULTADO/,$p' | grep -E "\| FAIL"
fallas=$(echo "$salida" | grep -cE "^\s+[0-9]+ \| FAIL")
pasaron=$(echo "$salida" | grep -cE "^\s+[0-9]+ \| PASS")
echo "Comprobaciones: $pasaron correctas, $fallas con fallo"
[ "$fallas" -eq 0 ] && [ "$trabajos" -eq 2 ] && echo "TODO OK (imagen oficial de Supabase)" || { echo "HAY FALLOS"; exit 1; }
