#!/bin/bash
set -e

npm install

if [ "$NODE_ENV" = "dev" ]; then
  npx prisma migrate deploy
  if [ ! -f node_modules/.seeded ]; then
    npx prisma db seed
    touch node_modules/.seeded
  fi
fi

# Then exec the container's main process (what's set as CMD in the Dockerfile).
exec "$@"

