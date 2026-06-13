# Moonirat — The Home of Music Videos

A creator-first music video streaming platform where artists upload music videos and fans discover, watch, follow, and share.

**GitHub (SOURCE OF TRUTH):** https://github.com/lolajaiye147-source/moonirat-music-video-hub.git

> GitHub is the single source of truth. Always pull from GitHub before editing. Push back after every change.

---

## V1 Architecture

```
Frontend    →  TanStack Start (React 19 + Vite 7 + TanStack Router)
Auth        →  Supabase Auth
Database    →  Supabase PostgreSQL
Storage     →  Supabase Storage
Realtime    →  Supabase Realtime
State       →  TanStack Query v5
Styling     →  Tailwind CSS v4 + Radix UI + shadcn/ui
```

There is **one** active architecture. Do not introduce NestJS, Prisma, JWT auth, or any alternative stack.

---

## Folder Structure

```
/
├── src/                          ← ACTIVE: All application source code
│   ├── routes/                   ← File-based routes (TanStack Router)
│   │   ├── index.tsx             ← Home feed
│   │   ├── search.tsx            ← Global search (artists + videos)
│   │   ├── discover.tsx          ← Discover / browse
│   │   ├── artists.$slug.tsx     ← Artist profile page
│   │   ├── videos.$id.tsx        ← Video player page
│   │   ├── auth.tsx              ← Sign in / sign up (Supabase Auth)
│   │   ├── reset-password.tsx    ← Password reset
│   │   └── _authenticated/       ← Protected routes (must be signed in)
│   │       ├── upload.tsx        ← Video upload (Supabase Storage)
│   │       ├── playlists.tsx     ← Playlists
│   │       ├── profile.tsx       ← User profile
│   │       ├── artist-dashboard.tsx ← Creator analytics
│   │       └── admin.tsx         ← Admin panel
│   ├── components/               ← Reusable UI components
│   │   ├── BottomNav.tsx         ← Mobile bottom navigation
│   │   ├── VideoCard.tsx         ← Video thumbnail card
│   │   ├── ArtistCard.tsx        ← Artist avatar card
│   │   └── ui/                   ← shadcn/ui primitives
│   ├── integrations/
│   │   └── supabase/             ← Supabase client + generated types
│   │       ├── client.ts         ← createClient (reads VITE_SUPABASE_URL)
│   │       └── types.ts          ← Auto-generated DB types (do not edit)
│   ├── lib/                      ← Utilities, auth context, API helpers
│   ├── hooks/                    ← Custom React hooks
│   ├── router.tsx                ← TanStack Router setup
│   ├── routeTree.gen.ts          ← Auto-generated route tree (do not edit manually)
│   ├── start.ts                  ← TanStack Start entry point
│   ├── server.ts                 ← SSR server entry
│   └── styles.css                ← Global styles + Moonirat design tokens
│
├── supabase/                     ← ACTIVE: Database migrations + config
│   ├── config.toml               ← Supabase project config
│   └── migrations/               ← SQL migrations (apply in order, never delete)
│
├── public/                       ← Static assets (robots.txt, icons, etc.)
├── vite.config.ts                ← Vite + TanStack Start config (do not change plugin list)
├── tsconfig.json                 ← TypeScript config for /src
├── components.json               ← shadcn/ui component config
├── eslint.config.js              ← ESLint config
├── .prettierrc                   ← Prettier config
├── .env.example                  ← Required environment variables (see below)
│
├── archive/                      ← LEGACY: Do not import from here
│   ├── README.md                 ← Archive explanation
│   ├── frontend/                 ← Legacy React+Vite+NestJS frontend (archived)
│   └── backend/                  ← Legacy NestJS+Prisma+JWT backend (archived)
│
└── artifacts/                    ← Replit workspace artifacts
    └── api-server/               ← Replit Express helper API (Replit-specific)
```

---

## Database Ownership — Supabase PostgreSQL

Supabase is the **sole** database. Prisma/NestJS database is archived.

### Schema (managed via migrations in `/supabase/migrations/`)

| Table | Description |
|-------|-------------|
| `profiles` | User profiles — linked to `auth.users` via `id` |
| `user_roles` | RBAC roles: `admin`, `moderator`, `user` |
| `artists` | Artist profiles: `name`, `slug`, `verified`, `featured`, `profile_image_url`, `cover_image_url` |
| `videos` | Videos: `title`, `video_url`, `thumbnail_url`, `view_count`, `duration`, `is_public`, `genre` |
| `follows` | User → Artist follow relationships |
| `playlists` | User playlists |
| `playlist_videos` | Videos in playlists (with `position` ordering) |

### Migrations

- All schema changes go in `supabase/migrations/` as SQL files.
- Never delete migrations — they are the history of the schema.
- Apply locally: `supabase db reset`
- Apply to production: `supabase db push` (or via Supabase dashboard)

---

## Auth Ownership — Supabase Auth

All authentication is handled by **Supabase Auth**.

- Sign up, sign in, sign out, password reset → `src/integrations/supabase/client.ts`
- Session management → `src/lib/auth-context.tsx` (React context wrapping `supabase.auth`)
- Protected routes → `src/routes/_authenticated.tsx` (redirects unauthenticated users)
- No JWT tokens are generated or validated by any custom backend.
- Do NOT use NestJS auth or any third-party JWT library.

---

## Storage Ownership — Supabase Storage

All file uploads (videos, thumbnails, profile images) use **Supabase Storage**.

- Upload from client using the Supabase JS client: `supabase.storage.from(bucket).upload(path, file)`
- No AWS S3 or pre-signed URLs from NestJS. The archived backend's S3 config is irrelevant.
- Bucket setup is managed via the Supabase dashboard or migrations.

---

## Environment Variables

```env
# Required — Supabase (get from Supabase project settings)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional — for SSR/server-side rendering
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Do NOT add AWS, NestJS, Prisma, or JWT env vars to the active app. Those live in `archive/`.

---

## Running Locally

```bash
# Install dependencies
pnpm install   # from workspace root

# Set env vars
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Run the frontend (TanStack Start dev server)
pnpm run dev   # from workspace root (uses vite.config.ts)

# Apply database migrations (Supabase CLI required)
supabase db reset      # local
supabase db push       # production
```

---

## Deployment

| Layer | Provider | Notes |
|-------|----------|-------|
| **Frontend** | Vercel or Replit Deployments | Deploy from `/` (workspace root). Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment env. |
| **Database** | Supabase PostgreSQL | Managed by Supabase. Apply migrations via `supabase db push`. |
| **Auth** | Supabase Auth | Managed by Supabase. No extra config needed beyond env vars. |
| **Storage** | Supabase Storage | Managed by Supabase. Configure buckets in the Supabase dashboard. |
| **Realtime** | Supabase Realtime | Built into Supabase. No extra config. |

**Vercel deployment steps:**
1. Connect the GitHub repo to Vercel.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel environment settings.
3. Build command: `vite build`
4. Output directory: `dist/`

---

## Feature Roadmap (V1 Priority Order)

| # | Feature | Status |
|---|---------|--------|
| 1 | Upload System | ✅ |
| 2 | Video Player | ✅ |
| 3 | Feed | ✅ |
| 4 | Artist Profiles | ✅ |
| 5 | Global Search | ✅ (`/search`) |
| 6 | Creator Analytics | 🔥 Next |
| 7 | Notifications | 🔥 Planned |
| 8 | Playlists | Planned |

---

## Key Conventions

- **Routing:** TanStack Router file-based routing. Add routes as files in `src/routes/`. Run `vite dev` to auto-regenerate `routeTree.gen.ts`. If adding routes manually, also update `routeTree.gen.ts`.
- **Data fetching:** TanStack Query (`useQuery`) + Supabase client directly. No REST API layer.
- **Styling:** Tailwind CSS v4 utility classes + Moonirat design tokens (neon-purple, neon-blue, glass, deep-navy). See `src/styles.css` for token definitions.
- **Components:** shadcn/ui primitives in `src/components/ui/`. Add new shadcn components via `npx shadcn@latest add <component>`.
- **Auth guard:** Wrap authenticated pages in `src/routes/_authenticated/`. The `_authenticated.tsx` layout handles the redirect.

---

## Architecture Anti-Patterns (Do Not Do)

- ❌ Do NOT call NestJS endpoints from the frontend
- ❌ Do NOT import from `archive/frontend/` or `archive/backend/`
- ❌ Do NOT use Prisma or any ORM — use Supabase client directly
- ❌ Do NOT use AWS S3 for uploads — use Supabase Storage
- ❌ Do NOT add custom JWT validation — use Supabase Auth
- ❌ Do NOT hardcode ports or base URLs — use `import.meta.env.*`

---

## User Preferences

- GitHub is the single source of truth — always pull before editing, push after.
- `GITHUB_PAT` is stored as a Replit secret.
- To sync latest from GitHub: `git pull https://$GITHUB_PAT@github.com/lolajaiye147-source/moonirat-music-video-hub.git main`

---

## Pull Latest from GitHub

```bash
git pull https://$GITHUB_PAT@github.com/lolajaiye147-source/moonirat-music-video-hub.git main
```

Or configure the remote once:
```bash
git remote set-url origin https://$GITHUB_PAT@github.com/lolajaiye147-source/moonirat-music-video-hub.git
git pull origin main
```
