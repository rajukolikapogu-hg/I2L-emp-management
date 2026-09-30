# CLAUDE.md

## Automation testing (TestSprite) — required before every feature PR

- Applies to any change under `src/`, `prisma/` or `e2e/`. Skip for docs-only / CI-only changes.
- Steps, in order, BEFORE `gh pr create`:
  a. `npm run build`, then start the app with `npm start` on port 3000 in the background
     (if 3000 is taken by something else, use another free port and pass that port to TestSprite):
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
  b. Use the TestSprite MCP tools (`mcp__testsprite__*`), in this order:
     1. `testsprite_bootstrap` — only if `testsprite_tests/tmp/config.json` does not exist
        (it is gitignored, so each clone bootstraps once). type = frontend, localPort = 3000,
        projectPath = repo root, testScope = "diff" for changes ("codebase" only for the first
        run). It opens a local setup page in the browser that a person must complete.
     2. `testsprite_generate_code_summary` — you write `testsprite_tests/tmp/code_summary.yaml`
        in the schema the tool returns.
     3. `testsprite_generate_standardized_prd`, then `testsprite_generate_frontend_test_plan`
        (needLogin = true).
     4. `testsprite_generate_code_and_execute` with projectName = "I2L-emp-management" and
        serverMode = "production". It returns a terminal command to run, then asks you to write
        `testsprite_tests/testsprite-mcp-test-report.md` from `testsprite_tests/tmp/raw_report.md`.
  c. Login for tests: username `eadmin` / password `epassword`.
  d. If tests fail: fix the code (not the tests) and rerun just the failed cases by calling
     `testsprite_generate_code_and_execute` again with their `testIds` (there is no separate
     rerun tool).
     Only a test that is itself wrong may be edited — say so in the PR.
  e. Stop the app. Commit `testsprite_tests/` (plan, test code, report) in the same PR.
     `testsprite_tests/tmp/` is gitignored scratch output.
  f. In the PR description add a "TestSprite" section: passed/failed counts
     and the report path.
- Results upload to the TestSprite dashboard project "I2L-emp-management"
  automatically; that is where they are reviewed.
- CI enforces this: the `testsprite-report` job in `.github/workflows/ci.yml` fails a PR that
  changes `src/` or `prisma/` unless it also updates `testsprite_tests/testsprite-mcp-test-report.md`,
  and fails if that report has any test case whose `- **Status:**` line is not `✅ Passed`.
  Keep that line format when writing the report.
- The TestSprite API key lives only in the local MCP server registration. Never write it
  into any file, and never create `.mcp.json`.
