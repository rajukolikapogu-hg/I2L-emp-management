# Production deploy

The test-build setup in [DOCKER.md](DOCKER.md) is unchanged: `docker/publish.sh` builds, pushes to
ghcr.io and deploys to the **test** site (`emp-management`, port 3000,
<https://empmanagement.idea2launch.dev>).

Production is a **second container on the same Hostinger server**, released from an image that is
already on ghcr.io. Nothing is rebuilt, and the release is pinned to the image digest, so production
runs exactly the build that was tested.

| | Test build | Production |
|---|---|---|
| Scripts | `publish.sh`, `deploy.sh`, `setup-site.sh` | `prod-release.sh`, `prod-deploy.sh`, `prod-setup-site.sh` |
| Container | `emp-management` | `emp-management-prod` (`PROD_APP`) |
| Server directory | `/opt/emp-management` | `/opt/emp-management-prod` (`PROD_DIR`) |
| Localhost port | 3000 | 3001 (`PROD_PORT`) |
| Data volume | `emp-management_emp-data` | `emp-management-prod_emp-data` |
| `SESSION_SECRET` | own `.env` | own `.env` (generated on the first deploy) |
| Started by | a developer's laptop | the **Deploy to production** workflow (Idea2Launch button or Actions tab) |

`docker/verify-site.sh` is shared. It already takes the URL as an argument.

## How a deploy runs

```
Idea2Launch Test Build tab — owner clicks "Deploy to production" on the current build
  → GitHub API: workflow_dispatch deploy-production.yml {image, digest, tag, request_id}
    → Actions runner (environment "production"):
        docker pull <image>@<digest>
        docker/prod-release.sh → docker/prod-deploy.sh:
          back up /app/data/emp.db → /opt/emp-management-prod/backups/ (last 10 kept)
          docker save | ssh docker load → emp-management-prod:deploy
          docker compose up -d → wait for healthy → write /opt/emp-management-prod/DEPLOYED
        docker/verify-site.sh $PROD_PUBLIC_URL
  ← Idea2Launch polls the run and shows queued → running → live / failed
```

`-dirty` builds (pushed from uncommitted changes) are refused. Only one production deploy runs at
a time (`concurrency: production-deploy`).

## One-time setup

### 1. Merge to `main`

GitHub only offers `workflow_dispatch` for workflows on the **default branch**. Merge
`.github/workflows/deploy-production.yml` and `docker/prod-*.sh` into `main` before the first deploy.

### 2. An ssh key for GitHub Actions

Create a key used only by the workflow. Don't reuse your laptop key.

```bash
mkdir -p ~/development/hostinger/emp-management-prod && cd ~/development/hostinger/emp-management-prod
# key pair: emp-management-prod-deploy-key (private) + emp-management-prod-deploy-key.pub (public)
ssh-keygen -t ed25519 -N '' -C 'emp-management-prod deploy (GitHub Actions)' \
  -f ./emp-management-prod-deploy-key
# authorize it on the server (uses your existing Hostinger key)
ssh -i ~/development/hostinger/id_ed25519 root@200.97.162.66 \
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys' < ./emp-management-prod-deploy-key.pub
# check it works: prints "ok"
ssh -i ./emp-management-prod-deploy-key root@200.97.162.66 'echo ok'
# the server's host key, for strict checking in CI
ssh-keyscan -t ed25519,rsa,ecdsa 200.97.162.66 > ./emp-management-prod-known-hosts
```

After step 4, delete the local folder: `rm -rf ~/development/hostinger/emp-management-prod`. The
server entry is recognizable in `~/.ssh/authorized_keys` by its comment,
`emp-management-prod deploy (GitHub Actions)`, which is how you find and remove it later.

### 3. Create the `production` environment

GitHub → repository → **Settings → Environments → New environment** → name it exactly
`production` → **Configure environment**.

- **Deployment protection rules:** leave *Required reviewers* **off**. The owner's click is the approval.
- **Deployment branches and tags:** choose *Selected branches and tags* and add `main`, so the workflow
  can only run from the reviewed branch.

### 4. Environment secrets

In the same page, under **Environment secrets → Add environment secret**:

| Secret | Value | Required |
|---|---|---|
| `PROD_SSH_KEY` | the full contents of `emp-management-prod-deploy-key`, including the `BEGIN`/`END` lines | yes |
| `PROD_KNOWN_HOSTS` | the full contents of `emp-management-prod-known-hosts` | yes |
| `GHCR_PULL_TOKEN` | classic PAT with `read:packages`. Only needed if step 6 is not possible | no |

### 5. Environment variables

Under **Environment variables → Add environment variable**:

| Variable | Example | Required | Notes |
|---|---|---|---|
| `PROD_HOST` | `200.97.162.66` | yes | The Hostinger server |
| `PROD_PUBLIC_URL` | `https://emp.idea2launch.dev` | yes | Checked after each deploy and shown as the environment URL |
| `PROD_USER` | `root` | no | Default `root` |
| `PROD_APP` | `emp-management-prod` | no | Must **not** be `emp-management` (the test site) |
| `PROD_PORT` | `3001` | no | Must not be used by another site on the server. Applied on the first deploy only |
| `PROD_DIR` | `/opt/emp-management-prod` | no | Default `/opt/$PROD_APP` |
| `GHCR_PULL_USER` | `rajukolikapogu-hg` | no | Only with `GHCR_PULL_TOKEN` |

Use the same `PROD_APP`/`PROD_PORT` values in step 8.

### 6. Let the workflow pull the image

The images are pushed from a laptop, not from Actions, so the repository may not have access to the
package yet: GitHub → your profile → **Packages → i2l-emp-management → Package settings →
Manage Actions access → Add repository** → `I2L-emp-management`, role **Read**.

If you can't do that, set `GHCR_PULL_TOKEN` (step 4) instead.

### 7. First deploy

Actions → **Deploy to production** → *Run workflow* on `main`. Fill in `image` (e.g.
`ghcr.io/rajukolikapogu-hg/i2l-emp-management`), `digest` (`sha256:…` from the package page or the
Idea2Launch Test Build tab) and `tag` (e.g. `1.0.0`). Or click **Deploy to production** in
Idea2Launch.

The first run creates `/opt/emp-management-prod/.env` with its own `SESSION_SECRET`. Until step 8
the verify step fails because the domain doesn't exist yet. The container itself is up on
`127.0.0.1:3001`.

### 8. Public host name (once)

From a machine with the Hostinger key and a Cloudflare token (Zone:DNS:Edit + Zone:Zone:Read):

```bash
export CF_API_TOKEN=...
PROD_DOMAIN=emp.idea2launch.dev docker/prod-setup-site.sh
```

This is `setup-site.sh` with production defaults: DNS A record, nginx site on `127.0.0.1:3001`,
Let's Encrypt certificate, `COOKIE_SECURE=true`. It doesn't touch the test site's nginx file.

### 9. Connect Idea2Launch

An Idea2Launch admin opens `/admin/projects/<project id>` → **Production deploy** and saves a GitHub
token that can run workflows on this repository:

- fine-grained PAT, repository access `I2L-emp-management`, permissions **Actions: Read and write**,
  **Deployments: Read**, **Metadata: Read** (automatic), or
- classic PAT with `repo`.

The owner then sees **Deploy to production** on the current build in B4 → Test Build.

## Operating

- **What is live:** `ssh root@200.97.162.66 cat /opt/emp-management-prod/DEPLOYED`, or the
  repository's *Environments → production* page.
- **Backups:** each deploy first copies the production database to
  `/opt/emp-management-prod/backups/emp-<UTC time>.db` (the last `PROD_BACKUP_KEEP`=10 are kept).
  Restore works like [DOCKER.md → Data, backups and restore](DOCKER.md#data-backups-and-restore), run
  from `/opt/emp-management-prod`.
- **Rollback:** Idea2Launch only deploys the latest build. To go back, run the workflow by hand with an
  older digest. Migrations are forward-only: if the newer build changed the schema, restore the
  pre-deploy backup too.
- **Settings:** edit `/opt/emp-management-prod/.env` on the server, then
  `cd /opt/emp-management-prod && docker compose up -d`.
- **By hand, without Actions:**
  `PROD_PUBLIC_URL=https://emp.idea2launch.dev docker/prod-release.sh <image> <digest> <tag>`
  (needs `docker login ghcr.io` and the Hostinger key).
