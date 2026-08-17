#!/bin/sh
set -e

# Não ecoa a DATABASE_URL: ela carrega usuário e senha do banco, e o log do
# container costuma ir parar em agregador de logs.
echo "⏳ Aguardando o banco de dados..."

# Extrai host e porta da DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRIES=0

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "❌ Banco de dados não ficou disponível após $((MAX_RETRIES * RETRY_INTERVAL))s"
    exit 1
  fi
  echo "⏳ Tentativa $RETRIES/$MAX_RETRIES - aguardando ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "✅ Banco de dados disponível!"

# Migrations e seed rodam só no serviço dedicado (RUN_MIGRATIONS=true), uma vez
# por deploy. Executar em todo start faz réplicas aplicarem migrations em
# paralelo e reexecuta o seed a cada restart sem necessidade.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🔄 Executando migrations..."
  npx prisma migrate deploy

  echo "🌱 Executando seed (população inicial)..."
  npm run seed

  echo "✅ Migrations e seed concluídos."
  exit 0
fi

echo "🚀 Iniciando servidor..."
exec npm run start:prod
