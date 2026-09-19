# Moonirat deployment boundaries

## System ownership

- **Moonirat web** is a TanStack Start application that runs on a standard Node
  runtime. Replit currently builds, hosts, and proxies this service.
- **Supabase** owns V1 authentication, PostgreSQL data, Row Level Security, and
  media object storage. Browser access uses the publishable key and is secured
  by RLS and Storage policies.
- **Moonirat API** is a separate Express service for future trusted server
  operations and operational endpoints. Current product reads and writes do not
  depend on it.
- **Moonirat.space** is a DNS and application-origin concern. It must not be
  embedded as a provider-specific runtime URL.

Replit-specific artifact metadata may describe how Replit starts these standard
Node services, but product code must not call Replit APIs or depend on Replit
filesystem persistence.

## Environment contract

Copy `.env.example` to `.env` for local or container development and replace
placeholder values. Never commit `.env`.

Public browser configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server configuration:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_APP_URL`
- `PORT`
- `BASE_PATH`

The service-role key is only valid in server-only modules. It must never use a
`VITE_` prefix or be returned to a browser.

## Local Node development

```sh
cp .env.example .env
pnpm install --frozen-lockfile
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/moonirat run dev
```

## Production Node runtime

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/moonirat run typecheck
pnpm --filter @workspace/moonirat run build
NODE_ENV=production PORT=3000 BASE_PATH=/ \
  node --enable-source-maps artifacts/moonirat/dist/server/index.mjs
```

Place a reverse proxy such as Caddy or nginx in front of port 3000 and terminate
TLS there. Forward the original host and protocol headers. Configure the same
public URL in Supabase Auth redirect settings.

## Docker

```sh
cp .env.example .env
docker compose up --build
```

The image contains only the generated Nitro server and public assets. Supabase
server credentials are injected at runtime. Browser-safe Supabase build
configuration is supplied through ephemeral BuildKit mounts so it is not
retained in image history.

## Replit hosting

Replit uses the registered artifact service to run the same build and Node
entrypoint. Store public configuration as environment variables and the
service-role value as a secret. Replit remains replaceable because the
application runtime is normal Node output.

## Supabase migration rule

`artifacts/moonirat/supabase/migrations` is the application migration history.
Every schema, index, RLS, function, and Storage policy change must be added there
and tested against a clean Supabase/PostgreSQL environment before production.
Do not run schema changes automatically during application startup.

Before applying a production migration:

1. Back up the database and record the current migration version.
2. Test the ordered migration set against a staging or disposable project.
3. Apply migrations using Supabase-supported tooling.
4. Verify RLS with anonymous, ordinary-user, owner, and admin sessions.
5. Verify Storage upload, read, and delete ownership.
6. Roll back by restoring the backup or applying an explicitly reviewed
   compensating migration; never improvise destructive rollback SQL.

## Moving to a VPS

1. Provision a current Node LTS host or use the container image.
2. Inject the variables from `.env.example` through the host secret manager.
3. Build and start the Nitro server on an internal port.
4. Configure TLS and reverse proxying for `moonirat.space`.
5. Update DNS records without changing application source.
6. Update allowed Supabase Auth redirect origins.
7. Run health, SSR, authentication, upload, playback, and RLS checks.

Supabase can remain managed during a hosting move. Replacing Supabase itself is a
separate data-platform migration and is not required to move Moonirat away from
Replit hosting.