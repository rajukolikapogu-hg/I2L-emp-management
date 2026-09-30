#!/usr/bin/env bash
# Deploy an image to the PRODUCTION container on the Hostinger server over SSH and (re)start it.
#
# Usage: docker/prod-deploy.sh <image>:<tag>
#
# The production twin of docker/deploy.sh, kept separate so the test-build site is never touched:
# its own container, image name, directory, port, data volume and .env on the same server.
#
#   test build (deploy.sh)            production (this script)
#   container  emp-management         container  emp-management-prod     (PROD_APP)
#   directory  /opt/emp-management    directory  /opt/emp-management-prod (PROD_DIR)
#   port       127.0.0.1:3000         port       127.0.0.1:3001           (PROD_PORT)
#
# Steps: stream the image (`docker save | ssh docker load`, no registry login on the server),
# back up the production database if the container already runs, write the server's
# docker-compose.yml, create .env with a new SESSION_SECRET on the first run only (kept afterwards),
# `docker compose up -d`, wait for the health check, record what was deployed in DEPLOYED.
#
# Normally run by docker/prod-release.sh (from the "Deploy to production" workflow), which pulls
# the image from ghcr.io by digest first.
#
# Settings (environment variables). PROD_* names on purpose: a shell set up for the test deploy
# (DEPLOY_*) can never point this script at the test container.
#   PROD_HOST          server address                  (default 200.97.162.66)
#   PROD_USER          ssh user                        (default root)
#   PROD_SSH_KEY       ssh private key                 (default ~/development/hostinger/id_ed25519)
#   PROD_KNOWN_HOSTS   known_hosts file; when set the host key is checked strictly
#   PROD_APP           container name                  (default emp-management-prod)
#   PROD_DIR           directory on the server         (default /opt/$PROD_APP)
#   PROD_PORT          localhost port on the server    (default 3001; must differ from the test site)
#   PROD_COOKIE_SECURE "true" when served over HTTPS   (default true)
#   PROD_BACKUP_KEEP   pre-deploy database backups kept on the server (default 10)
#   PROD_IMAGE_DIGEST  digest recorded in DEPLOYED     (set by prod-release.sh)
# PROD_PORT and PROD_COOKIE_SECURE are only applied when the server .env is first created.
# See docs/PROD_DEPLOY.md.
set -euo pipefail

cd "$(dirname "$0")/.."

case "${1:-}" in
  -h|--help) sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  "") echo "Usage: docker/prod-deploy.sh <image>:<tag>" >&2; exit 2 ;;
esac

image=$1
host=${PROD_HOST:-200.97.162.66}
user=${PROD_USER:-root}
key=${PROD_SSH_KEY:-$HOME/development/hostinger/id_ed25519}
app=${PROD_APP:-emp-management-prod}
dir=${PROD_DIR:-/opt/$app}
port=${PROD_PORT:-3001}
cookie_secure=${PROD_COOKIE_SECURE:-true}
backup_keep=${PROD_BACKUP_KEEP:-10}
digest=${PROD_IMAGE_DIGEST:-}

# The test site lives in emp-management / /opt/emp-management / port 3000 (docker/deploy.sh).
if [ "$app" = emp-management ] || [ "$dir" = /opt/emp-management ]; then
  echo "PROD_APP/PROD_DIR point at the test-build site ($app, $dir). Use a separate name." >&2
  exit 2
fi
[[ $app =~ ^[a-z0-9][a-z0-9_.-]*$ ]] || { echo "PROD_APP must be a lowercase container name." >&2; exit 2; }
[[ $port =~ ^[0-9]+$ ]] || { echo "PROD_PORT must be a number." >&2; exit 2; }

if ! docker image inspect "$image" >/dev/null 2>&1; then
  echo "Image $image not found locally. Pull or build it first (docker/prod-release.sh does)." >&2
  exit 1
fi

ssh_opts=(-i "$key" -o BatchMode=yes)
if [ -n "${PROD_KNOWN_HOSTS:-}" ]; then
  ssh_opts+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$PROD_KNOWN_HOSTS")
else
  ssh_opts+=(-o StrictHostKeyChecking=accept-new)
fi
remote() { ssh "${ssh_opts[@]}" "$user@$host" "$@"; }

echo "Checking $user@$host"
remote 'command -v docker >/dev/null && docker compose version >/dev/null' \
  || { echo "Docker with the compose plugin is not installed on $host." >&2; exit 1; }

first_deploy=false
remote "test -f '$dir/.env'" || first_deploy=true

if [ "$first_deploy" = true ]; then
  # Another site on this server (the test build on 3000, other apps) must not already own the port.
  if remote "ss -ltnH '( sport = :$port )' | grep -q ."; then
    echo "Port $port is already in use on $host. Set PROD_PORT to a free port." >&2
    exit 1
  fi
fi

# Back up the production database before the new image runs its migrations (they are forward-only).
if remote "docker inspect '$app' >/dev/null 2>&1 && docker exec '$app' test -f /app/data/emp.db"; then
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  echo "Backing up the production database to $dir/backups/emp-$stamp.db"
  remote "set -e; mkdir -p -m 700 '$dir/backups'
    docker exec '$app' sqlite3 /app/data/emp.db \".backup '/app/data/pre-deploy.db'\"
    docker cp '$app:/app/data/pre-deploy.db' '$dir/backups/emp-$stamp.db'
    docker exec '$app' rm -f /app/data/pre-deploy.db
    chmod 600 '$dir/backups/emp-$stamp.db'
    ls -1t '$dir'/backups/emp-*.db | tail -n +$((backup_keep + 1)) | xargs -r rm -f"
else
  echo "No running production database yet; skipping the backup"
fi

# The container always runs "<app>:deploy", so the compose file never changes between deploys.
echo "Uploading $image (this streams the image, no registry involved)"
docker save "$image" | gzip | remote 'gunzip | docker load'
remote "docker tag '$image' '$app:deploy'"

echo "Writing $dir/docker-compose.yml"
# Compose names the volume after the directory (e.g. emp-management-prod_emp-data), so production
# data never shares the test site's volume.
remote "mkdir -p '$dir' && cat > '$dir/docker-compose.yml'" <<COMPOSE
# Managed by docker/prod-deploy.sh in the I2L-emp-management repository. Edit .env, not this file.
services:
  app:
    image: $app:deploy
    container_name: $app
    init: true
    restart: unless-stopped
    environment:
      SESSION_SECRET: \${SESSION_SECRET:?Set SESSION_SECRET in .env}
      COOKIE_SECURE: \${COOKIE_SECURE:-false}
    ports:
      - "\${HOST_BIND:-127.0.0.1}:\${HOST_PORT:-$port}:3000"
    volumes:
      - emp-data:/app/data

volumes:
  emp-data:
COMPOSE

# .env is created once; SESSION_SECRET must stay the same across deploys.
if [ "$first_deploy" = true ]; then
  echo "Creating $dir/.env with a new SESSION_SECRET"
  remote "umask 077 && { printf 'SESSION_SECRET=%s\n' \"\$(openssl rand -hex 32)\"; \
    printf 'COOKIE_SECURE=%s\nHOST_BIND=127.0.0.1\nHOST_PORT=%s\n' '$cookie_secure' '$port'; } > '$dir/.env'"
else
  echo "Keeping existing $dir/.env"
fi

echo "Starting the container"
remote "cd '$dir' && docker compose up -d --remove-orphans"

echo "Waiting for the health check"
status=""
for _ in $(seq 1 30); do
  status=$(remote "docker inspect -f '{{.State.Health.Status}}' '$app' 2>/dev/null" || true)
  [ "$status" = healthy ] && break
  [ "$status" = unhealthy ] && { echo "Container is unhealthy:" >&2; remote "cd '$dir' && docker compose logs --tail 50 app" >&2; exit 1; }
  sleep 3
done
if [ "$status" != healthy ]; then
  echo "Container did not become healthy in time (status: ${status:-unknown}):" >&2
  remote "cd '$dir' && docker compose logs --tail 50 app" >&2
  exit 1
fi

remote "printf 'IMAGE=%s\nDIGEST=%s\nDEPLOYED_AT=%s\n' '$image' '$digest' '$(date -u +%Y-%m-%dT%H:%M:%SZ)' > '$dir/DEPLOYED'"
remote "docker image prune -f >/dev/null"
published=$(remote "cd '$dir' && sed -n 's/^HOST_BIND=//p; s/^HOST_PORT=//p' .env | paste -sd:")
echo "Deployed $image to $host as $app (container published on ${published:-127.0.0.1:$port})"
