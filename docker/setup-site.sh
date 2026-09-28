#!/usr/bin/env bash
# One-time setup of a public HTTPS site for an app container on the Hostinger Ubuntu server:
# Cloudflare DNS record -> nginx reverse proxy -> Let's Encrypt certificate.
#
# Usage: docker/setup-site.sh [--skip-dns]
#
# Run it once per application (the defaults are for this app; set SITE_* for the next one).
# Deploy the app first (npm run docker:deploy). Safe to run again: every step checks the current
# state, so a run that stopped half-way (e.g. DNS not visible yet) is finished by re-running.
#
# What it does:
#   1. Cloudflare: creates or updates the A record SITE_DOMAIN -> DEPLOY_HOST in the zone that
#      holds the domain. The token needs Zone:DNS:Edit (and Zone:Zone:Read) on that zone.
#   2. Server: moves the app container to 127.0.0.1:SITE_UPSTREAM_PORT so that nginx owns ports
#      80/443 for every site on the host, installs nginx + certbot if missing, writes a catch-all
#      default server and /etc/nginx/sites-available/SITE_DOMAIN (plain HTTP for now).
#   3. Waits until the name resolves, gets a Let's Encrypt certificate (HTTP-01; certbot.timer
#      renews it and reloads nginx), switches the site to HTTPS + redirect and sets
#      COOKIE_SECURE=true for the app.
#   4. Verifies https://SITE_DOMAIN with docker/verify-site.sh.
#
# Settings (environment variables):
#   CF_API_TOKEN        Cloudflare API token         (required unless --skip-dns)
#   CF_ACCOUNT_ID       Cloudflare account id        (optional; narrows the zone lookup)
#   CF_PROXIED          "true" = proxy through Cloudflare (orange cloud). Default "false": DNS
#                       only, like the parent domain. With "true" the zone's SSL/TLS mode must be
#                       Full (strict), otherwise Cloudflare talks plain HTTP to the server.
#   SITE_DOMAIN         public host name             (default empmanagement.idea2launch.dev)
#   SITE_APP            container name               (default emp-management)
#   SITE_UPSTREAM_PORT  localhost port for the app    (default 3000; unique per app)
#   LETSENCRYPT_EMAIL   certificate expiry notices   (default: git config user.email)
#   DNS_TIMEOUT         seconds to wait for DNS      (default 300)
#   DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_DIR   as in docker/deploy.sh
#                       (DEPLOY_DIR defaults to /opt/SITE_APP)
# See docs/DOCKER.md.
set -euo pipefail

cd "$(dirname "$0")/.."

skip_dns=false
for arg in "$@"; do
  case "$arg" in
    --skip-dns) skip_dns=true ;;
    -h|--help) sed -n '2,35p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

domain=${SITE_DOMAIN:-empmanagement.idea2launch.dev}
app=${SITE_APP:-emp-management}
port=${SITE_UPSTREAM_PORT:-3000}
proxied=${CF_PROXIED:-false}
host=${DEPLOY_HOST:-200.97.162.66}
user=${DEPLOY_USER:-root}
key=${DEPLOY_SSH_KEY:-$HOME/development/hostinger/id_ed25519}
dir=${DEPLOY_DIR:-/opt/$app}
email=${LETSENCRYPT_EMAIL:-$(git config user.email || true)}
dns_timeout=${DNS_TIMEOUT:-300}

case "$proxied" in true|false) ;; *) echo "CF_PROXIED must be true or false" >&2; exit 2 ;; esac
[ -n "$email" ] || { echo "Set LETSENCRYPT_EMAIL (no git user.email to fall back to)." >&2; exit 2; }

ssh_opts=(-i "$key" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)
remote() { ssh "${ssh_opts[@]}" "$user@$host" "$@"; }
step() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------- 1. Cloudflare DNS
cf_api() { # method path [json-body]
  curl -sS -X "$1" "https://api.cloudflare.com/client/v4$2" \
    -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
    ${3:+--data "$3"}
}
json() { python3 -c "import sys, json; d = json.load(sys.stdin); $1"; }

if [ "$skip_dns" = false ]; then
  step "Cloudflare: A record $domain -> $host (proxied=$proxied)"
  [ -n "${CF_API_TOKEN:-}" ] || { echo "Set CF_API_TOKEN, or pass --skip-dns and create the record yourself." >&2; exit 2; }

  # Find the zone: idea2launch.dev for empmanagement.idea2launch.dev (walk up the labels).
  zone_id=""; zone_name=""; candidate=$domain
  while :; do
    candidate=${candidate#*.}
    [[ $candidate == *.* ]] || break
    zone_id=$(cf_api GET "/zones?name=$candidate${CF_ACCOUNT_ID:+&account.id=$CF_ACCOUNT_ID}" \
      | json 'print(d["result"][0]["id"] if d.get("success") and d.get("result") else "")')
    [ -z "$zone_id" ] || { zone_name=$candidate; break; }
  done
  if [ -z "$zone_id" ]; then
    visible=$(cf_api GET "/zones?per_page=50" | json 'print(", ".join(z["name"] for z in d.get("result") or []) or "none")')
    echo "No Cloudflare zone for $domain is visible to this token (it can see: $visible)." >&2
    echo "Edit the token's Zone Resources to include the zone that holds $domain (Zone:DNS:Edit and" >&2
    echo "Zone:Zone:Read), or create the A record yourself and re-run with --skip-dns." >&2
    exit 1
  fi
  echo "Zone: $zone_name ($zone_id)"

  records=$(cf_api GET "/zones/$zone_id/dns_records?name=$domain" \
    | json 'print("\n".join(" ".join([r["id"], r["type"], r["content"], str(r["proxied"]).lower()]) for r in d.get("result") or []))')
  body=$(printf '{"type":"A","name":"%s","content":"%s","proxied":%s,"ttl":1,"comment":"%s (docker/setup-site.sh)"}' \
    "$domain" "$host" "$proxied" "$app")
  if [ -z "$records" ]; then
    cf_api POST "/zones/$zone_id/dns_records" "$body" \
      | json 'import sys; sys.exit(0) if d["success"] else sys.exit("Cloudflare error: %s" % d["errors"])'
    echo "Created A $domain -> $host"
  else
    while read -r id type content rec_proxied; do
      if [ "$type" != A ]; then
        echo "A $type record already exists for $domain ($content). Remove it in Cloudflare first." >&2; exit 1
      fi
      if [ "$content" = "$host" ] && [ "$rec_proxied" = "$proxied" ]; then
        echo "A $domain -> $host already exists"
      else
        cf_api PATCH "/zones/$zone_id/dns_records/$id" "$body" \
          | json 'import sys; sys.exit(0) if d["success"] else sys.exit("Cloudflare error: %s" % d["errors"])'
        echo "Updated A $domain: $content (proxied=$rec_proxied) -> $host (proxied=$proxied)"
      fi
    done <<<"$records"
  fi
fi

# ---------------------------------------------------------------- 2. Server: container + nginx
step "Checking $user@$host"
remote "test -f '$dir/.env' && docker inspect '$app' >/dev/null 2>&1" \
  || { echo "$app is not deployed in $dir on $host. Run npm run docker:deploy first." >&2; exit 1; }

# Set KEY=value in the server .env (add or replace). Prints "changed" when it differs.
set_env() {
  remote "cd '$dir' && if grep -q '^$1=$2\$' .env; then :; elif grep -q '^$1=' .env; then sed -i 's|^$1=.*|$1=$2|' .env; echo changed; else echo '$1=$2' >> .env; echo changed; fi"
}
wait_healthy() {
  local status=""
  for _ in $(seq 1 30); do
    status=$(remote "docker inspect -f '{{.State.Health.Status}}' '$app' 2>/dev/null" || true)
    [ "$status" = healthy ] && return 0
    [ "$status" = unhealthy ] && break
    sleep 3
  done
  echo "Container $app is not healthy (status: ${status:-unknown}):" >&2
  remote "cd '$dir' && docker compose logs --tail 50" >&2
  return 1
}

step "Publishing the $app container on 127.0.0.1:$port only (nginx takes port 80)"
changed=$(set_env HOST_BIND 127.0.0.1; set_env HOST_PORT "$port")
if [ -n "$changed" ]; then
  remote "cd '$dir' && docker compose up -d --remove-orphans"
  wait_healthy
else
  echo "Already published on 127.0.0.1:$port"
fi

step "Installing nginx and certbot (if missing)"
remote 'if command -v nginx >/dev/null && command -v certbot >/dev/null; then echo "already installed: $(nginx -v 2>&1), $(certbot --version 2>&1)";
  else export DEBIAN_FRONTEND=noninteractive; apt-get update -q && apt-get install -y -q nginx certbot ssl-cert; fi'

step "Writing the nginx base configuration"
listen6=$(remote 'test -f /proc/net/if_inet6 && echo yes || echo no')
v6() { [ "$listen6" = yes ] && printf '    listen [::]:%s;\n' "$1" || true; }
remote 'mkdir -p /var/www/letsencrypt /etc/nginx/snippets && rm -f /etc/nginx/sites-enabled/default'
remote 'cat > /etc/nginx/conf.d/server-names.conf' <<'CONF'
# Managed by docker/setup-site.sh. Room for long host names in server_name.
server_names_hash_bucket_size 64;
CONF
remote 'cat > /etc/nginx/snippets/tls.conf' <<'CONF'
# Managed by docker/setup-site.sh. Shared TLS settings (Mozilla "intermediate").
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
CONF
remote 'cat > /etc/nginx/sites-available/000-default' <<CONF
# Managed by docker/setup-site.sh. Requests for host names no site is configured for are dropped.
server {
    listen 80 default_server;
$(v6 80)    server_name _;
    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 444; }
}
server {
    listen 443 ssl default_server;
$(v6 "443 ssl")    server_name _;
    ssl_certificate     /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    include snippets/tls.conf;
    return 444;
}
CONF
remote 'ln -sfn ../sites-available/000-default /etc/nginx/sites-enabled/000-default'

probe=$(date +%s)-$RANDOM
site_config() { # http | https
  cat <<CONF
# Managed by docker/setup-site.sh in the I2L-emp-management repository.
# $domain -> http://127.0.0.1:$port (container $app)
server {
    listen 80;
$(v6 80)    server_name $domain;

    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location = /.well-known/site-probe { default_type text/plain; return 200 "$probe"; }
CONF
  if [ "$1" = https ]; then
    cat <<CONF
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl;
$(v6 "443 ssl")    http2 on;
    server_name $domain;

    ssl_certificate     /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include snippets/tls.conf;
    add_header Strict-Transport-Security "max-age=31536000" always;

    client_max_body_size 10m;
CONF
  fi
  cat <<CONF
    location / {
        proxy_pass http://127.0.0.1:$port;
        include proxy_params;
        proxy_http_version 1.1;
        proxy_read_timeout 60s;
    }
}
CONF
}
install_site() { # http | https
  site_config "$1" | remote "cat > '/etc/nginx/sites-available/$domain'"
  remote "ln -sfn '../sites-available/$domain' '/etc/nginx/sites-enabled/$domain' \
    && nginx -t && systemctl enable --now nginx >/dev/null 2>&1 && systemctl reload nginx"
}

has_cert=$(remote "test -s '/etc/letsencrypt/live/$domain/fullchain.pem' && echo yes || echo no")
step "Writing /etc/nginx/sites-available/$domain ($([ "$has_cert" = yes ] && echo https || echo http, no certificate yet))"
install_site "$([ "$has_cert" = yes ] && echo https || echo http)"

# ---------------------------------------------------------------- 3. DNS wait + certificate
step "Waiting for $domain to resolve (up to ${dns_timeout}s)"
deadline=$((SECONDS + dns_timeout))
while :; do
  answer=$(dig +short @1.1.1.1 "$domain" A 2>/dev/null | tail -1 || true)
  if { [ "$proxied" = true ] && [ -n "$answer" ]; } || [ "$answer" = "$host" ]; then
    echo "$domain -> $answer"; break
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "$domain does not resolve to $host yet (got: ${answer:-nothing})." >&2
    echo "Create/fix the DNS record and run this script again; the server side is ready." >&2
    exit 1
  fi
  sleep 5
done
# Prove the request reaches this site's server block before asking Let's Encrypt to try.
for _ in $(seq 1 12); do
  got=$(curl -sS --max-time 10 --resolve "$domain:80:$host" "http://$domain/.well-known/site-probe" 2>/dev/null || true)
  [ "$got" = "$probe" ] && break
  sleep 5
done
[ "$got" = "$probe" ] || { echo "http://$domain/.well-known/site-probe did not reach nginx on $host (got: '$got')." >&2; exit 1; }
echo "nginx answers for $domain"

step "Let's Encrypt certificate for $domain"
remote "certbot certonly --webroot -w /var/www/letsencrypt -d '$domain' --non-interactive --agree-tos \
  --email '$email' --keep-until-expiring --deploy-hook 'systemctl reload nginx'"
remote 'systemctl is-active --quiet certbot.timer && echo "certbot.timer active (auto-renewal)" || systemctl enable --now certbot.timer'

step "Switching $domain to HTTPS"
install_site https

step "Setting COOKIE_SECURE=true for $app"
if [ -n "$(set_env COOKIE_SECURE true)" ]; then
  remote "cd '$dir' && docker compose up -d --remove-orphans"
  wait_healthy
else
  echo "Already set"
fi

# ---------------------------------------------------------------- 4. Verify
step "Verifying https://$domain"
docker/verify-site.sh "https://$domain"
echo
echo "Done. $domain is served by nginx on $host -> container $app (127.0.0.1:$port)."
echo "Site config: /etc/nginx/sites-available/$domain; certificate renews via certbot.timer."
