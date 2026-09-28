#!/usr/bin/env bash
# Verify that the deployed site is up: GET <url>/login must answer 200 with the app title in the
# page, and (for https URLs) the plain-http URL must redirect to https. Retries while the app is
# still starting.
#
# Usage: docker/verify-site.sh [<url>]
#   url: default $DEPLOY_PUBLIC_URL, else https://empmanagement.idea2launch.dev
#   VERIFY_TIMEOUT  seconds to keep retrying (default 90)
#   VERIFY_MARKER   text expected in the login page (default "Employee Management")
set -euo pipefail

case "${1:-}" in -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;; esac

url=${1:-${DEPLOY_PUBLIC_URL:-https://empmanagement.idea2launch.dev}}
url=${url%/}
timeout=${VERIFY_TIMEOUT:-90}
marker=${VERIFY_MARKER:-Employee Management}

body=$(mktemp)
trap 'rm -f "$body"' EXIT
deadline=$((SECONDS + timeout))
while :; do
  code=$(curl -sS -L --max-time 15 -o "$body" -w '%{http_code}' "$url/login" 2>"$body.err") || true
  code=${code:-000}
  if [ "$code" = 200 ] && grep -q "$marker" "$body"; then break; fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "FAIL: $url/login answered HTTP $code after ${timeout}s" >&2
    [ "$code" = 000 ] && sed 's/^/  /' "$body.err" >&2
    [ "$code" = 200 ] && echo "  (200, but \"$marker\" is not in the page)" >&2
    rm -f "$body.err"
    exit 1
  fi
  sleep 5
done
rm -f "$body.err"
echo "OK  $url/login -> 200, page contains \"$marker\""

if [[ $url == https://* ]]; then
  hostport=${url#https://}
  http_url="http://$hostport"
  redirect=$(curl -sS -o /dev/null --max-time 15 -w '%{http_code} %{redirect_url}' "$http_url/login" 2>/dev/null || echo "000")
  case "$redirect" in
    30[1278]\ https://*) echo "OK  $http_url -> ${redirect#* }" ;;
    *) echo "WARN $http_url/login does not redirect to https (got: $redirect)" ;;
  esac
  h=${hostport%%:*}; p=${hostport#*:}; [ "$p" != "$hostport" ] || p=443
  expiry=$(echo | openssl s_client -servername "$h" -connect "$h:$p" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//' || true)
  [ -z "$expiry" ] || echo "OK  certificate valid until $expiry"
fi
