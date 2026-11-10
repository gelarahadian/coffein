#!/bin/sh
set -e

echo "==> prisma migrate deploy"
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "==> prisma db seed"
  npx prisma db seed
fi

exec node dist/main.js
