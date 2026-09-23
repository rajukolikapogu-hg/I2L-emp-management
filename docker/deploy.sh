#!/usr/bin/env bash
# Deploy a locally built image to the GoDaddy Ubuntu server over SSH and (re)start it there.
#
# Usage: docker/deploy.sh [<image>:<tag>]     (default: emp-management:latest)
#
# The image is streamed with `docker save | ssh docker load`, so the server needs no registry
# login. The script then writes /opt/emp-management/docker-compose.yml on the server, creates
# its .env with a generated SESSION_SECRET on the first run (kept afterwards, so sessions
# survive redeploys), runs `docker compose up -d` and waits for the container to be healthy.
#
# Settings (environment variables, all optional):
#   DEPLOY_HOST       server address           (default 200.97.162.66)
#   DEPLOY_USER       ssh user                 (default root)
#   DEPLOY_SSH_KEY    ssh private key          (default ~/development/hostinger/id_ed25519)
#   DEPLOY_DIR        directory on the server  (default /opt/emp-management)
#   DEPLOY_HOST_BIND  interface published on the server (default 0.0.0.0, see docs/DOCKER.md)
#   DEPLOY_HOST_PORT  port published on the server      (default 80)
#   DEPLOY_COOKIE_SECURE  "true" once the app is behind HTTPS (default false)
# The bind/port/cookie values are only applied when the server .env is first created.
# See docs/DOCKER.md.
set -euo pipefail

cd "$(dirname "$0")/.."

case "${1:-}" in
  -h|--help) sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac

image=${1:-emp-management:latest}
host=${DEPLOY_HOST:-200.97.162.66}
user=${DEPLOY_USER:-root}
key=${DEPLOY_SSH_KEY:-$HOME/development/hostinger/id_ed25519}
dir=${DEPLOY_DIR:-/opt/emp-management}
host_bind=${DEPLOY_HOST_BIND:-0.0.0.0}
host_port=${DEPLOY_HOST_PORT:-80}
cookie_secure=${DEPLOY_COOKIE_SECURE:-false}

if ! docker image inspect "$image" >/dev/null 2>&1; then
  echo "Image $image not found locally. Build it first (docker/publish.sh or docker compose build)." >&2
  exit 1
fi

ssh_opts=(-i "$key" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)
remote() { ssh "${ssh_opts[@]}" "$user@$host" "$@"; }

echo "Checking $user@$host"
remote 'command -v docker >/dev/null && docker compose version >/dev/null' \
  || { echo "Docker with the compose plugin is not installed on $host." >&2; exit 1; }

# The container always runs the image tag "emp-management:deploy" so the compose file on the
# server never changes; every deploy retags the uploaded image to it.
echo "Uploading $image (this streams the image, no registry involved)"
docker save "$image" | gzip | remote 'gunzip | docker load'
remote "docker tag '$image' emp-management:deploy"

echo "Writing $dir/docker-compose.yml"
remote "mkdir -p '$dir' && cat > '$dir/docker-compose.yml'" <<'COMPOSE'
# Managed by docker/deploy.sh in the I2L-emp-management repository. Edit .env, not this file.
services:
  app:
    image: emp-management:deploy
    container_name: emp-management
    init: true
    restart: unless-stopped
    environment:
      SESSION_SECRET: ${SESSION_SECRET:?Set SESSION_SECRET in .env}
      COOKIE_SECURE: ${COOKIE_SECURE:-false}
    ports:
      - "${HOST_BIND:-127.0.0.1}:${HOST_PORT:-3000}:3000"
    volumes:
      - emp-data:/app/data

volumes:
  emp-data:
COMPOSE

# .env is created once; SESSION_SECRET must stay the same across deploys.
remote "test -f '$dir/.env'" && echo "Keeping existing $dir/.env" || {
  echo "Creating $dir/.env with a new SESSION_SECRET"
  remote "umask 077 && { printf 'SESSION_SECRET=%s\n' \"\$(openssl rand -hex 32)\"; \
    printf 'COOKIE_SECURE=%s\nHOST_BIND=%s\nHOST_PORT=%s\n' '$cookie_secure' '$host_bind' '$host_port'; } > '$dir/.env'"
}

echo "Starting the container"
remote "cd '$dir' && docker compose up -d --remove-orphans"

echo "Waiting for the health check"
for _ in $(seq 1 30); do
  status=$(remote "docker inspect -f '{{.State.Health.Status}}' emp-management 2>/dev/null" || true)
  [ "$status" = healthy ] && break
  [ "$status" = unhealthy ] && { echo "Container is unhealthy:" >&2; remote "cd '$dir' && docker compose logs --tail 50 app" >&2; exit 1; }
  sleep 3
done
if [ "$status" != healthy ]; then
  echo "Container did not become healthy in time (status: ${status:-unknown}):" >&2
  remote "cd '$dir' && docker compose logs --tail 50 app" >&2
  exit 1
fi

remote "docker image prune -f >/dev/null"
published=$(remote "cd '$dir' && sed -n 's/^HOST_PORT=//p' .env")
echo "Deployed $image to $host: http://$host:${published:-3000}"
