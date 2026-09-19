# CLAUDE.md

## Automation testing (TestSprite) — required before every feature PR

- Applies to any change under `src/`, `prisma/` or `e2e/`. Skip for docs-only / CI-only changes.
- Steps, in order, BEFORE `gh pr create`:
  a. `npm run build`, then start the app with `npm start` on port 3000 in the background:
     ```bash
     DATABASE_URL=file:../data/testsprite.db \
     SESSION_SECRET=<any random string of 32+ characters> \
     COOKIE_SECURE=false \
     BIND_HOST=127.0.0.1 \
     PORT=3000 \
     npm start
     ```
     `COOKIE_SECURE` must be set: in production mode the server refuses to start without it.
     Never commit the secret or write it into a file.
  b. Use the TestSprite MCP tools: bootstrap for a frontend app on localPort 3000,
     project path = repo root, test scope = "diff" for changes (use "codebase" only
     for the first run). Generate code summary + PRD + frontend test plan, then
     generate and execute the tests.
  c. Login for tests: username `eadmin` / password `epassword`.
  d. If tests fail: fix the code (not the tests) and use the rerun tool.
     Only a test that is itself wrong may be edited — say so in the PR.
  e. Stop the app. Commit `testsprite_tests/` (plan, test code, report) in the same PR.
     `testsprite_tests/tmp/` is gitignored scratch output.
  f. In the PR description add a "TestSprite" section: passed/failed counts
     and the report path.
- Results upload to the TestSprite dashboard project "I2L-emp-management"
  automatically; that is where they are reviewed.
- CI enforces this: the `testsprite-report` job in `.github/workflows/ci.yml` fails a PR
  that changes `src/` or `prisma/` without also updating the TestSprite report.
- The TestSprite API key lives only in the local MCP server registration. Never write it
  into any file, and never create `.mcp.json`.
