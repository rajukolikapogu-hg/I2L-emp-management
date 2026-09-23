#!/usr/bin/env bash
# Build the image, push it to GitHub Container Registry (ghcr.io) and deploy it to the
# GoDaddy server (docker/deploy.sh).
#
# Usage: docker/publish.sh [--allow-dirty] [--no-deploy] [--no-push]
#
# --no-deploy: build and push only. --no-push: build and deploy only (no ghcr.io login needed).
# Deploy target and ssh key: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY (see docker/deploy.sh).
# Tags pushed (clean working tree): <version from package.json>, sha-<short commit>, latest.
# With --allow-dirty (uncommitted changes) only sha-<short commit>-dirty is pushed, so an
# unreproducible build never becomes "latest" or a release version.
#
# Auth: uses the credentials from an earlier `docker login ghcr.io`. Or set GHCR_TOKEN (a classic
# PAT with write:packages; fine-grained tokens are not accepted by ghcr.io) and optionally
# GHCR_USER, and the script logs in first.
#
# Overrides: GHCR_IMAGE (default ghcr.io/<owner>/<repo> from the origin remote, lowercased).
# See docs/DOCKER.md.
set -euo pipefail

cd "$(dirname "$0")/.."

allow_dirty=false
deploy=true
push=true
for arg in "$@"; do
  case "$arg" in
    --allow-dirty) allow_dirty=true ;;
    --no-deploy) deploy=false ;;
    --no-push) push=false ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# owner/repo from the origin remote (ssh or https form, with or without .git).
remote=$(git remote get-url origin)
repo_path=$(printf '%s' "$remote" | sed -E 's#^.*[:/]([^/:]+/[^/]+)$#\1#; s#\.git$##')
owner=${repo_path%%/*}
image=${GHCR_IMAGE:-ghcr.io/$(printf '%s' "$repo_path" | tr '[:upper:]' '[:lower:]')}

version=$(node -p "require('./package.json').version")
sha=$(git rev-parse --short HEAD)
revision=$(git rev-parse HEAD)

if [ -n "$(git status --porcelain)" ]; then
  if [ "$allow_dirty" != true ]; then
    echo "Working tree has uncommitted changes. Commit them, or pass --allow-dirty to push" >&2
    echo "a sha-${sha}-dirty tag only." >&2
    exit 1
  fi
  tags=("sha-${sha}-dirty")
else
  tags=("$version" "sha-${sha}" "latest")
fi

if [ "$push" = true ] && [ -n "${GHCR_TOKEN:-}" ]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-$owner}" --password-stdin
fi

tag_args=()
for t in "${tags[@]}"; do tag_args+=(-t "$image:$t"); done

echo "Building $image (${tags[*]})"
# The source label links the package to the repository on GitHub.
docker build "${tag_args[@]}" \
  --label "org.opencontainers.image.source=https://github.com/$repo_path" \
  --label "org.opencontainers.image.revision=$revision" \
  --label "org.opencontainers.image.version=$version" \
  --label "org.opencontainers.image.description=Employee Management" \
  .

if [ "$push" = true ]; then
  for t in "${tags[@]}"; do
    docker push "$image:$t"
  done
  echo "Pushed:"
  for t in "${tags[@]}"; do echo "  $image:$t"; done
fi

if [ "$deploy" = true ]; then
  docker/deploy.sh "$image:${tags[0]}"
fi
