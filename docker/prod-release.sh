#!/usr/bin/env bash
# Release one image that is already on ghcr.io to PRODUCTION: pull it by digest, deploy it with
# docker/prod-deploy.sh, then check the public site with docker/verify-site.sh.
#
# Usage: docker/prod-release.sh [--no-verify] <image> <digest> [<label>]
#   image   ghcr.io/<owner>/<repo>, without a tag
#   digest  sha256:… — the exact build to release (a tag can move; a digest cannot)
#   label   the version tag it is known by, e.g. 1.0.0 or sha-70b49dd (default: digest prefix)
#
# This is what the "Deploy to production" workflow (.github/workflows/deploy-production.yml) runs
# when a project owner clicks "Deploy to production" in Idea2Launch's Test Build tab. It can also
# be run by hand from a machine with the production ssh key.
#
# Refuses "-dirty" builds: they were pushed from uncommitted changes and cannot be reproduced.
#
# Registry auth: an earlier `docker login ghcr.io`, or GHCR_TOKEN (classic PAT with read:packages)
# and optionally GHCR_USER. Server settings: the PROD_* variables of docker/prod-deploy.sh.
# PROD_PUBLIC_URL is the site checked afterwards (skipped when unset or with --no-verify).
# See docs/PROD_DEPLOY.md.
set -euo pipefail

cd "$(dirname "$0")/.."

verify=true
args=()
for arg in "$@"; do
  case "$arg" in
    --no-verify) verify=false ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) args+=("$arg") ;;
  esac
done
[ "${#args[@]}" -ge 2 ] || { echo "Usage: docker/prod-release.sh [--no-verify] <image> <digest> [<label>]" >&2; exit 2; }

image=${args[0]}
digest=${args[1]}
label=${args[2]:-}
if [ -z "$label" ]; then hex=${digest#sha256:}; label=${hex:0:12}; fi
app=${PROD_APP:-emp-management-prod}

[[ $image =~ ^ghcr\.io/[a-z0-9._-]+/[a-z0-9._/-]+$ ]] \
  || { echo "Image must be ghcr.io/<owner>/<name> in lowercase, without a tag (got: $image)." >&2; exit 2; }
[[ $digest =~ ^sha256:[0-9a-f]{64}$ ]] \
  || { echo "Digest must be sha256:<64 hex characters> (got: $digest)." >&2; exit 2; }
if [[ $label == *-dirty ]]; then
  echo "Refusing $label: -dirty builds come from uncommitted changes and never go to production." >&2
  exit 1
fi

if [ -n "${GHCR_TOKEN:-}" ]; then
  owner=${image#ghcr.io/}; owner=${owner%%/*}
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-$owner}" --password-stdin
fi

echo "Pulling $image@$digest ($label)"
docker pull "$image@$digest"

# A local tag, so the image keeps a name through `docker save | docker load` on the server
# (an image referenced only by digest loads untagged). Tag characters: [A-Za-z0-9_.-], max 128.
safe_label=$(printf '%s' "$label" | tr -c 'A-Za-z0-9_.-' '-' | cut -c1-100)
local_ref="$app:release-$safe_label"
docker tag "$image@$digest" "$local_ref"

PROD_IMAGE_DIGEST=$digest docker/prod-deploy.sh "$local_ref"

if [ "$verify" = true ] && [ -n "${PROD_PUBLIC_URL:-}" ]; then
  echo "Verifying $PROD_PUBLIC_URL"
  docker/verify-site.sh "$PROD_PUBLIC_URL"
elif [ "$verify" = true ]; then
  echo "PROD_PUBLIC_URL is not set; skipping the public-site check."
fi
