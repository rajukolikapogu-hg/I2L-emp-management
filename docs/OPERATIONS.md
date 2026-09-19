# Operations Guide

How to deploy, secure, back up, and correct data in Emp-management. This covers the
Sprint 2 hardening deliverables: restricted database permissions, backup guidance,
and deployment to a single host.

## 1. Deploying to the single host

Requirements: Linux host, Node.js 20+ (22 recommended), a dedicated OS user (e.g. `empapp`).

```bash
# As the empapp user, in the application directory
npm ci
cp .env.example .env
# Edit .env: set SESSION_SECRET to a random 64-hex string:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run build
npm start            # applies migrations, restricts DB permissions, then serves on 127.0.0.1:3000
```

`npm start` runs `prisma migrate deploy` and `scripts/secure-db.mjs` on every launch, so the
database schema is always current and permissions are re-applied after each restart.

To keep it running, use a process manager. Example systemd unit (`/etc/systemd/system/emp-management.service`):

```ini
[Unit]
Description=Emp-management
After=network.target

[Service]
User=empapp
WorkingDirectory=/opt/emp-management
Environment=NODE_ENV=production
Environment=BIND_HOST=127.0.0.1
Environment=COOKIE_SECURE=false
Environment=PORT=3000
UMask=0077
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite file, e.g. `file:../data/emp.db` (relative paths resolve from `prisma/`). |
| `SESSION_SECRET` | yes (except `NODE_ENV=test`/`development`) | Signs the session cookie. At least 32 characters. Changing it logs the admin out. In test/development, if unset, a random key is generated per process (sessions do not survive a restart). |
| `COOKIE_SECURE` | yes in production | Exactly `true` or `false`. Missing or any other value stops the server at startup (fail closed). Use `true` when served over HTTPS. |
| `BIND_HOST` | no | Interface `npm start` binds to (`next start -H`). Defaults to `127.0.0.1`. Set a LAN IP to serve a trusted local network. Must be set in the process environment (e.g. the systemd unit), not `.env`: it is expanded by the shell before Next.js loads `.env`. `HOSTNAME` is **not** read by `next start`. |
| `PORT` | no | Port to listen on. Defaults to `3000`. |

## 2. Network exposure

The admin credentials (`eadmin` / `epassword`) are fixed by design and cannot be rotated.
The app therefore **must only be reachable from a trusted local network**:

- Bind to localhost or a LAN interface (`BIND_HOST=127.0.0.1`, the default, or the LAN IP), never a public one or `0.0.0.0`.
- Do not port-forward it or expose it to the internet.
- If remote access is ever needed, put it behind a reverse proxy that adds its own
  authentication (e.g. VPN, or proxy basic auth/SSO) and TLS, and set `COOKIE_SECURE=true`.

## 3. Database file permissions

All data lives in one SQLite file (default `data/emp.db`). On every start,
`scripts/secure-db.mjs` sets:

- the data directory to `700` (owner only), and
- the database and its `-journal`/`-wal`/`-shm` files to `600` (owner read/write only).

Verify on the host (TC-044):

```bash
ls -ld data data/emp.db
# drwx------ empapp empapp data
# -rw------- empapp empapp data/emp.db
sudo -u nobody cat data/emp.db   # must fail with "Permission denied"
```

Run `npm run db:secure` to re-apply permissions manually at any time.

## 4. Backup and restore

There is no in-app way to re-enter records, so backups are the only protection against
disk loss or corruption. **Back up at least once a day, and always right after recording a
month's payments.**

### Taking a backup

Use SQLite's online backup, which is safe while the app is running:

```bash
mkdir -p -m 700 backups
sqlite3 data/emp.db ".backup 'backups/emp-$(date +%F).db'"
chmod 600 backups/*.db
```

If `sqlite3` is not installed, stop the app, copy the file, then start it again:

```bash
sudo systemctl stop emp-management
cp -p data/emp.db "backups/emp-$(date +%F).db"
sudo systemctl start emp-management
```

Example daily cron entry for the `empapp` user (keeps 30 days):

```cron
0 2 * * * cd /opt/emp-management && sqlite3 data/emp.db ".backup 'backups/emp-$(date +\%F).db'" && find backups -name 'emp-*.db' -mtime +30 -delete
```

Copy backups off the host regularly (e.g. to an encrypted USB drive or another machine);
a backup on the same disk does not protect against disk failure. Backups contain salary
data: store them with the same care as the live database.

### Checking a backup

```bash
sqlite3 backups/emp-2026-09-18.db "PRAGMA integrity_check; SELECT COUNT(*) FROM Employee; SELECT COUNT(*) FROM Payment;"
```

### Restoring

```bash
sudo systemctl stop emp-management
cp -p data/emp.db data/emp.db.before-restore      # keep the current file just in case
cp backups/emp-2026-09-18.db data/emp.db
rm -f data/emp.db-journal data/emp.db-wal data/emp.db-shm
sudo systemctl start emp-management               # re-applies permissions on start
```

## 5. Correcting a data-entry mistake

Employees and payments cannot be edited or deleted — not in the UI, not via any route, and
not at the database level (triggers abort every `UPDATE`/`DELETE` on those tables). If a
mistake must be corrected, do it deliberately and with a backup:

1. Stop the app and take a backup (section 4).
2. Open the database: `sqlite3 data/emp.db`.
3. Temporarily drop the relevant trigger, make the fix, and recreate the trigger in one transaction:

```sql
BEGIN;
DROP TRIGGER "Employee_no_update";
UPDATE "Employee" SET "salaryCents" = 520000 WHERE "id" = 7;   -- amounts are in cents
CREATE TRIGGER "Employee_no_update" BEFORE UPDATE ON "Employee"
BEGIN SELECT RAISE(ABORT, 'Employee records are immutable'); END;
COMMIT;
```

The four triggers are `Employee_no_update`, `Employee_no_delete`, `Payment_no_update` and
`Payment_no_delete`; their definitions are in
`prisma/migrations/*_init/migration.sql`. To remove a wrongly recorded payment, drop and
recreate `Payment_no_delete` the same way. Confirm afterwards with:

```sql
SELECT name FROM sqlite_master WHERE type = 'trigger';   -- all four must be listed
```

4. Start the app again and record what was changed and why.

## 6. Launch checklist

- [ ] `.env` has a unique `SESSION_SECRET` and `COOKIE_SECURE` set to `true`/`false`; `NODE_ENV=production`.
- [ ] App bound to localhost/LAN only; not reachable from the internet.
- [ ] `data/` is `700` and `data/emp.db` is `600`, owned by the app user.
- [ ] Daily backup scheduled and one restore rehearsed.
- [ ] Logged in as `eadmin`, added an employee, marked them paid, and saw the payment in their history.
- [ ] This guide handed over to the admin.
