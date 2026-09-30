#!/bin/sh
# Same start-up sequence as `npm start`: apply migrations, lock down the database file,
# then serve. `exec` makes Next.js the main process so it receives stop signals directly.
set -eu

prisma migrate deploy --schema prisma/schema.prisma
node scripts/secure-db.mjs

# The standalone server reads the bind address from HOSTNAME.
HOSTNAME="${BIND_HOST}" exec node server.js
