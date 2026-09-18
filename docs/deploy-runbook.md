# cPanel deploy and rollback runbook

## Supported topology

- Static Next.js export from `out/` on the public site document root.
- Laravel 13 application from `api/` on PHP 8.3+.
- MariaDB through `pdo_mysql`.
- A dedicated API document root pointing only to `api/public`; the Laravel application, `.env`, logs, and storage remain outside the public web root.

The checked cPanel account currently exposes PHP 8.5, MariaDB tooling, Terminal/SSH, and the needed PHP extensions. It does not expose a Node application manager, so frontend compilation happens before deployment.

## Confirmed production targets

| Purpose | Exact target |
|---|---|
| Frontend | `https://fixsa.valosystems.co.za` → `/home/valosyst/public_html/fixsa.valosystems.co.za` |
| API public root | `https://api.fixsa.valosystems.co.za` → `/home/valosyst/public_html/api.fixsa.valosystems.co.za` |
| Private Laravel root | `/home/valosyst/apps/fixsa-api/current` (symlink to an immutable release) |
| Database / user | `valosyst_fixsa` / `valosyst_fixsa` with least-privilege application access |

SSH uses the provider-confirmed account endpoint and an authorised key. Passwords and the AssemblyAI key are never committed or echoed by the release workflow.

## Preflight

```bash
npm ci
npm run verify
npm run test:e2e
npm run audit
npm run audit:api
```

Confirm `.env*`, audio, recordings, database files, credentials, and private data are absent from Git. `out/` is generated locally and must contain `index.html`, `404.html`, `_next/`, and `pcm-processor.js`.

## Server configuration

1. Create a dedicated MariaDB database and least-privilege application user in cPanel.
2. Place the Laravel application at the approved private application root.
3. Point the API domain document root to the approved `api/public` directory. Never expose the Laravel project root.
4. Run `composer install --no-dev --classmap-authoritative` inside the private API root.
5. Create the server `.env` from `.env.example`; set `APP_ENV=production`, `APP_DEBUG=false`, exact URLs, MariaDB credentials, `ASSEMBLYAI_API_KEY`, and the exact frontend origin in `CORS_ALLOWED_ORIGINS`.
6. Run `php artisan key:generate`, `php artisan migrate --force`, and optionally `FIXSA_SEED_DEMO=true php artisan db:seed --force` for the labelled synthetic hackathon dataset.
7. Run `php artisan optimize` and ensure `storage/` plus `bootstrap/cache/` are writable by the PHP user.
8. Build the frontend with `NEXT_PUBLIC_FIXSA_API_BASE_URL=https://<approved-api-origin> npm run build:cpanel`.
9. Publish only the contents of `out/` plus `deploy/frontend.htaccess` renamed to `.htaccess` into the approved frontend document root.

## Acceptance

1. `GET https://<api>/api/v1/health` returns `status: ok`, `service: fixsa-api`, and `database: mysql` without secrets.
2. Public tracking returns only allowlisted fields; the operator endpoint returns `401` without a token.
3. Create a synthetic report twice with the same idempotency key and confirm only one report exists.
4. Verify `FSA-2026-1811` as not fixed and confirm it atomically reopens with a public timeline event.
5. Run the resident, voice, keyboard, tracking, Proof-of-Fix, operator, mobile, privacy, and failure-state journeys over HTTPS.
6. Start one short live voice session, confirm the temporary token and one tool call, send `session.end`, and check that neither keys nor transcript content appear in logs.

## Rollback

1. Put the API in maintenance mode for a schema rollback: `php artisan down`.
2. Restore the pre-deploy database backup if the migration changed data incompatibly. Prefer forward fixes for additive migrations.
3. Restore the prior immutable API release and frontend bundle.
4. Run `php artisan migrate:status`, `php artisan optimize:clear`, `php artisan optimize`, then `php artisan up`.
5. Repeat health, privacy, idempotency, tracking, and Proof-of-Fix checks.

The first production release was promoted on 18 September 2026 after owner approval. Future releases still require an authorised SSH key and the same preflight and acceptance gates.
