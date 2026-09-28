# Running with Docker

The same app as [OPERATIONS.md](OPERATIONS.md), packaged as one container. Everything there about
network exposure, backups and data correction still applies. This page covers only what is
different in Docker.

## What the image does

- Multi-stage build on `node:22-bookworm-slim`: Next.js `standalone` output plus the Prisma CLI
  (pinned to the lockfile version) for migrations. No dev dependencies, tests or `.env` inside.
- On every start, `docker/entrypoint.sh` does what `npm start` does: `prisma migrate deploy`,
  then `scripts/secure-db.mjs` (data dir `700`, database `600`), then it serves on port `3000`.
- Runs as the unprivileged `node` user (uid 1000). App files are read-only to that user. Only
  `/app/data`, a volume holding `emp.db`, is writable.
- Includes `sqlite3` for online backups and a health check on `/login`.
- Refuses to start if `COOKIE_SECURE` is missing or invalid, as outside Docker.

## Quick start (Docker Compose)

```bash
# 1. Secrets: compose reads .env next to docker-compose.yml (it is never copied into the image).
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
#    or: openssl rand -hex 32
# COOKIE_SECURE defaults to false; set COOKIE_SECURE=true when served over HTTPS.

# 2. Build and start
docker compose up -d --build

# 3. Check
docker compose ps          # STATUS should become "healthy"
docker compose logs -f app
```

Open <http://127.0.0.1:3000> and sign in as `eadmin` / `epassword`.

### Compose settings (`.env` or shell)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | none, **required** | Signs the session cookie. At least 32 characters. `compose up` fails without it. |
| `COOKIE_SECURE` | `false` | `true` when users reach the app over HTTPS (TLS reverse proxy). |
| `HOST_BIND` | `127.0.0.1` | Host interface the port is published on. Set to the host's LAN IP to serve a trusted local network. |
| `HOST_PORT` | `3000` | Host port. |

Inside the container the server listens on `0.0.0.0:3000`. It has to, so that Docker can
forward traffic to it. Exposure is controlled by the **published** port (`HOST_BIND`), which defaults to
localhost. As in [OPERATIONS.md §2](OPERATIONS.md#2-network-exposure), never publish it on a
public interface: the admin credentials are fixed.

Note that Docker's published ports bypass host firewalls such as `ufw`, so `HOST_BIND` is the
setting that actually limits who can connect.

## Plain `docker` (without Compose)

```bash
docker build -t emp-management .
docker run -d --name emp-management --init --restart unless-stopped \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -e COOKIE_SECURE=false \
  -p 127.0.0.1:3000:3000 \
  -v emp-data:/app/data \
  emp-management
```

Keep the same `SESSION_SECRET` across restarts: changing it signs the admin out. Store it somewhere
safe instead of generating a new one each time.

## Data, backups and restore

The database is `/app/data/emp.db` in the `emp-data` volume (Compose names it
`<project>_emp-data`, e.g. `emp-management_emp-data`). It survives `docker compose down`,
rebuilds and upgrades, but `docker compose down -v` **deletes it**.

To use a host directory instead of a named volume, replace `emp-data:/app/data` with
`./data:/app/data` and make the directory owned by uid 1000: `mkdir -p data && sudo chown 1000:1000 data`.

Online backup (safe while running), copied out to the host:

```bash
mkdir -p -m 700 backups
docker compose exec app sqlite3 /app/data/emp.db ".backup '/tmp/emp-backup.db'"
docker compose cp app:/tmp/emp-backup.db "backups/emp-$(date +%F).db"
docker compose exec app rm /tmp/emp-backup.db
chmod 600 backups/*.db
```

Restore:

```bash
docker compose stop app
docker compose cp "backups/emp-2026-09-18.db" app:/app/data/emp.db
docker compose run --rm --no-deps --user root --entrypoint sh app \
  -c 'chown node:node /app/data/emp.db && rm -f /app/data/emp.db-journal /app/data/emp.db-wal /app/data/emp.db-shm'
docker compose start app      # re-applies permissions on start
```

For data correction (OPERATIONS.md §5), stop the app, then open a shell against the volume:
`docker compose run --rm --no-deps --entrypoint sh app` and use `sqlite3 /app/data/emp.db`.

## Publishing to GitHub Container Registry

`docker/publish.sh` (or `npm run docker:publish`) builds the image and pushes it to
`ghcr.io/<owner>/<repo>` (lowercased; here `ghcr.io/rajukolikapogu-hg/i2l-emp-management`).

```bash
docker login ghcr.io -u <github-user>   # once; password = classic PAT with write:packages
docker/publish.sh
```

- On a clean working tree it pushes `<package.json version>`, `sha-<commit>` and `latest`.
- With uncommitted changes it stops. `--allow-dirty` pushes only `sha-<commit>-dirty`.
- Instead of logging in first, you can set `GHCR_TOKEN` (and `GHCR_USER` if it differs from the
  repo owner). ghcr.io does not accept fine-grained tokens. Use a classic PAT.
- `GHCR_IMAGE` overrides the image name.

New packages are private. To change that, open Package settings on GitHub.

ghcr.io packages always belong to the account (`github.com/<owner>?tab=packages`). The image's
`org.opencontainers.image.source` label connects the package to this repository, so it also shows
under the repository's Packages. The build uses `--provenance=false` because ghcr.io does not read
that label through the attestation index that buildx creates by default. A package pushed before
that change can be connected once by hand: Package settings → Connect repository.
To run a published image, replace `build: .` in `docker-compose.yml` with
`image: ghcr.io/rajukolikapogu-hg/i2l-emp-management:<tag>`. Then run `docker compose pull && docker compose up -d`.

## Deploying to the Hostinger server

`npm run docker:publish` builds the image, pushes it to ghcr.io, runs `docker/deploy.sh` (deploys
to the Ubuntu server at `200.97.162.66` over SSH) and then `docker/verify-site.sh`, which checks
that <https://empmanagement.idea2launch.dev/login> answers 200 with the app title and that
`http://` redirects to `https://`. `npm run docker:deploy` runs only the deploy step against the
local `emp-management:latest` image.

```bash
npm run docker:publish                  # build + push + deploy + verify
docker/publish.sh --no-push             # build + deploy + verify, without touching ghcr.io
docker/publish.sh --no-deploy           # build + push only
docker/publish.sh --no-verify           # skip the public-site check
docker/deploy.sh emp-management:latest  # deploy an already built image
npm run docker:verify                   # only the public-site check (DEPLOY_PUBLIC_URL overrides the URL)
```

What `deploy.sh` does:

- Streams the image with `docker save | ssh docker load`, so the server never needs registry
  credentials or a copy of the source, and retags it `emp-management:deploy`.
- Writes `/opt/emp-management/docker-compose.yml` on the server (same as the local one, but using
  the uploaded image instead of `build: .`).
- On the first deploy creates `/opt/emp-management/.env` with a generated `SESSION_SECRET`,
  `COOKIE_SECURE=true`, `HOST_BIND=127.0.0.1` and `HOST_PORT=3000`. Later deploys keep that file,
  so the secret (and therefore admin sessions) survives. Edit it on the server to change settings.
- Runs `docker compose up -d`, waits for the health check and prints where the container listens.

Settings: `DEPLOY_HOST` (default `200.97.162.66`), `DEPLOY_USER` (`root`), `DEPLOY_SSH_KEY`
(`~/development/hostinger/id_ed25519`), `DEPLOY_DIR` (`/opt/emp-management`), and for the first
`.env` only `DEPLOY_HOST_BIND`, `DEPLOY_HOST_PORT`, `DEPLOY_COOKIE_SECURE`.

The container is published on `127.0.0.1:3000` only. nginx on the server terminates TLS and
proxies the public host name to it (next section). The admin credentials are fixed, so still
restrict who can reach the site (see [OPERATIONS.md §2](OPERATIONS.md#2-network-exposure)).

Backups on the server work as above, run from `/opt/emp-management`.

## Public host name: Cloudflare DNS + nginx + Let's Encrypt (once per app)

`docker/setup-site.sh` (or `npm run docker:setup-site`) makes a deployed container reachable at
its own HTTPS host name. The server hosts several sites: nginx owns ports 80/443 and each site is
one file in `/etc/nginx/sites-available/`, proxying to that app's localhost port.

```bash
export CF_API_TOKEN=...            # Cloudflare token: Zone:DNS:Edit + Zone:Zone:Read on the zone
export CF_ACCOUNT_ID=...           # optional
npm run docker:setup-site          # this app: empmanagement.idea2launch.dev -> 127.0.0.1:3000

# Next app on the same server (deploy it first, on its own port):
SITE_DOMAIN=other.idea2launch.dev SITE_APP=other-app SITE_UPSTREAM_PORT=3001 docker/setup-site.sh
```

Steps, each skipped when already done, so re-running finishes an interrupted run:

1. Creates or updates the Cloudflare A record `SITE_DOMAIN -> DEPLOY_HOST`. Default `CF_PROXIED=false`
   (DNS only). With `CF_PROXIED=true` the zone's SSL/TLS mode must
   be Full (strict). `--skip-dns` if the record is managed elsewhere.
2. Sets `HOST_BIND=127.0.0.1` / `HOST_PORT=SITE_UPSTREAM_PORT` in the server `.env` and recreates the
   container, installs `nginx`, `certbot` and `ssl-cert` if missing, writes a catch-all default
   server (unknown host names get the connection closed) and the site's HTTP server block.
3. Waits until the name resolves (`DNS_TIMEOUT`, default 300 s), proves the request reaches nginx,
   gets a certificate with `certbot certonly --webroot` (`LETSENCRYPT_EMAIL`, default git
   `user.email`; `certbot.timer` renews it and reloads nginx), rewrites the site block with HTTPS
   plus an HTTP redirect and HSTS, and sets `COOKIE_SECURE=true` for the app.
4. Runs `docker/verify-site.sh https://SITE_DOMAIN`.

Note that `.dev` is on the browsers' HSTS preload list, so browsers only ever open
`*.idea2launch.dev` over HTTPS. A subdomain without a certificate is not reachable.

## Upgrading

```bash
git pull
docker compose up -d --build   # migrations run automatically on start
```

Take a backup first.
