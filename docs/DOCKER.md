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
To run a published image, replace `build: .` in `docker-compose.yml` with
`image: ghcr.io/rajukolikapogu-hg/i2l-emp-management:<tag>`. Then run `docker compose pull && docker compose up -d`.

## Deploying to the GoDaddy server

`npm run docker:publish` builds the image, pushes it to ghcr.io and then runs `docker/deploy.sh`,
which deploys it to the Ubuntu server at `200.97.162.66` over SSH. `npm run docker:deploy`
runs only the deploy step against the local `emp-management:latest` image.

```bash
npm run docker:publish                  # build + push + deploy
docker/publish.sh --no-push             # build + deploy, without touching ghcr.io
docker/publish.sh --no-deploy           # build + push only
docker/deploy.sh emp-management:latest  # deploy an already built image
```

What `deploy.sh` does:

- Streams the image with `docker save | ssh docker load`, so the server never needs registry
  credentials or a copy of the source, and retags it `emp-management:deploy`.
- Writes `/opt/emp-management/docker-compose.yml` on the server (same as the local one, but using
  the uploaded image instead of `build: .`).
- On the first deploy creates `/opt/emp-management/.env` with a generated `SESSION_SECRET`,
  `COOKIE_SECURE=false`, `HOST_BIND=0.0.0.0` and `HOST_PORT=80`. Later deploys keep that file, so
  the secret (and therefore admin sessions) survives. Edit it on the server to change settings.
- Runs `docker compose up -d`, waits for the health check and prints the URL.

Settings: `DEPLOY_HOST` (default `200.97.162.66`), `DEPLOY_USER` (`root`), `DEPLOY_SSH_KEY`
(`~/development/hostinger/id_ed25519`), `DEPLOY_DIR` (`/opt/emp-management`), and for the first
`.env` only `DEPLOY_HOST_BIND`, `DEPLOY_HOST_PORT`, `DEPLOY_COOKIE_SECURE`.

**Exposure warning.** Unlike the local default, the server publishes the app on all interfaces
so that it is reachable at `http://200.97.162.66/`. The admin credentials are fixed and the
connection is plain HTTP. Put a TLS reverse proxy (e.g. Caddy) in front of it, set
`HOST_BIND=127.0.0.1` and `COOKIE_SECURE=true` in the server `.env`, and restrict access with a
firewall or VPN before real data goes in. See [OPERATIONS.md §2](OPERATIONS.md#2-network-exposure).

Backups on the server work as above, run from `/opt/emp-management`.

## Upgrading

```bash
git pull
docker compose up -d --build   # migrations run automatically on start
```

Take a backup first.
