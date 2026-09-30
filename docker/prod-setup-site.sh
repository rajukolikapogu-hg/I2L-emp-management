#!/usr/bin/env bash
# One-time public HTTPS setup for the PRODUCTION container: Cloudflare DNS -> nginx -> Let's Encrypt.
#
# Usage: PROD_DOMAIN=<host name> docker/prod-setup-site.sh [--skip-dns]
#
# A thin wrapper around docker/setup-site.sh (which is unchanged and still serves the test site),
# filled in with the production defaults of docker/prod-deploy.sh. Run it once, after the first
# production deploy. Safe to run again.
#
# Settings:
#   PROD_DOMAIN   public host name for production     (required, e.g. emp.idea2launch.dev)
#   PROD_APP      container name                       (default emp-management-prod)
#   PROD_DIR      directory on the server              (default /opt/$PROD_APP)
#   PROD_PORT     the container's localhost port       (default 3001)
#   PROD_HOST, PROD_USER, PROD_SSH_KEY                 as in docker/prod-deploy.sh
#   CF_API_TOKEN, CF_ACCOUNT_ID, CF_PROXIED, LETSENCRYPT_EMAIL, DNS_TIMEOUT   as in setup-site.sh
# See docs/PROD_DEPLOY.md.
set -euo pipefail

cd "$(dirname "$0")/.."

case "${1:-}" in -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;; esac

: "${PROD_DOMAIN:?Set PROD_DOMAIN to the production host name}"
app=${PROD_APP:-emp-management-prod}
[ "$app" != emp-management ] || { echo "PROD_APP must not be the test-build container." >&2; exit 2; }

SITE_DOMAIN=$PROD_DOMAIN \
SITE_APP=$app \
SITE_UPSTREAM_PORT=${PROD_PORT:-3001} \
DEPLOY_HOST=${PROD_HOST:-200.97.162.66} \
DEPLOY_USER=${PROD_USER:-root} \
DEPLOY_SSH_KEY=${PROD_SSH_KEY:-$HOME/development/hostinger/id_ed25519} \
DEPLOY_DIR=${PROD_DIR:-/opt/$app} \
  exec docker/setup-site.sh "$@"
