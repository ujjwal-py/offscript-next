# Offscript (Next.js)

Offscript rebuilt as a single **Next.js 16** application. This is the same fullstack blogging and social publishing platform as the original (`typescript-social-media`), with the same API routes, the same database schema, and the same frontend routes — now powered by the Next.js App Router, Route Handlers, Server Components and [shadcn](https://ui.shadcn.com) (Base UI) for the interface.

Users can create drafts, submit posts for moderation, manage published content, search and like public posts, upload images, and authenticate with JWT HTTP-only cookies. Administrators can review pending submissions, approve or reject content, and remove published posts.

## What changed from the original

- **One codebase** — the Express server and the React/Vite client are merged into a single Next.js app.
- **Same API routes** — every original `/v1` endpoint exists at the exact same path, implemented as App Router Route Handlers under `src/app/v1/`.
- **Same database** — the identical Prisma schema (and the full migration history) now lives in `prisma/`.
- **Same frontend routes** — `/`, `/home`, `/auth`, `/post/:id`, `/my-posts`, `/profile`, `/admin` are App Router pages.
- **shadcn/ui** replaces Chakra UI (dark theme is still the default, with a light/dark toggle).
- **Next.js features used**: App Router, Route Handlers, React Server Components, streaming with `loading.tsx` Suspense boundaries, `error.tsx`/`not-found.tsx`, `proxy.ts` route guards, URL-driven search/sort/pagination (`searchParams`), `next/image` optimization, `next/font`, typed routes, Metadata API and Turbopack.
- Client/server fixes: the original client called three endpoints that didn't exist on its server (`/public-posts`, `/update-post-status/:id`, `DELETE /posts/:id`); this app uses the real routes (`/search/posts`, `/admin/posts/:id/status`, `DELETE /post/:id`).

## Project structure

```text
offscript-next/
├── prisma/                  # Prisma schema and migrations (identical to original)
├── public/uploads/          # Legacy locally-stored images
├── src/
│   ├── app/                 # App Router
│   │   ├── v1/              # API route handlers (same paths as the Express /v1 router)
│   │   ├── home/            # /home feed page
│   │   ├── auth/            # /auth sign in / sign up page
│   │   ├── post/[id]/       # /post/:id single post page
│   │   ├── my-posts/        # /my-posts drafts page (protected)
│   │   ├── profile/         # /profile page (protected)
│   │   ├── admin/           # /admin dashboard (ADMIN only)
│   │   ├── layout.tsx       # Root layout: fonts, providers, navbar, footer, toaster
│   │   ├── error.tsx        # Error boundary
│   │   └── not-found.tsx    # 404 page
│   ├── components/          # App components (post cards, dialogs, forms, ...)
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom hooks (useDebounce)
│   ├── lib/                 # Config, auth, prisma, storage, validation, services
│   │   └── services/        # Controller logic shared by pages and route handlers
│   ├── store/               # Zustand store (optimistic likes)
│   ├── generated/prisma/    # Generated Prisma client (not committed)
│   └── proxy.ts             # Optimistic route protection (my-posts, profile, admin)
├── next.config.ts
├── prisma.config.ts
├── Dockerfile               # standalone build, dev, migrator and runner stages
├── compose.yaml             # db + migrations + app (+ dev profile)
├── .dockerignore
└── .env.example
```

## Features

### Authentication and authorization

- User signup, signin, logout, and current-user verification (`/v1/signup`, `/v1/signin`, `/v1/me`, `/v1/logout`)
- JWT authentication stored in an HTTP-only `jwt_token` cookie (24 hours)
- Role-based authorization with `USER` and `ADMIN` roles
- Admin-only dashboard and moderation endpoints (`INSUFFICIENT_PERMISSIONS` for non-admins)
- Password hashing with bcrypt

### Post creation and lifecycle

- Create posts with a title, description, and optional image
- Edit posts owned by the current user
- Delete user-owned posts
- Save posts as `DRAFT`, submit them for moderation as `PENDING`
- Admin moderation statuses: `PUBLISHED`, `REJECTED`, and `REMOVED`
- Status badges on draft, pending, and published post cards
- Post ownership enforced by authenticated routes

### Admin moderation

- Dedicated admin dashboard at `/admin` (ADMIN role only)
- View all pending posts, inspect full content in a full-screen dialog
- Approve (`PUBLISHED`) or reject (`REJECTED`) pending posts
- Search published posts by title and remove them (`REMOVED`)
- Protected by `proxy.ts`, server-side role checks and the `requireAdminUser` API guard

### Search, sorting, and pagination

- Search public posts, your published posts, and admin's published posts by title (debounced 300 ms, URL-driven)
- Sort by likes or last updated time, ascending or descending
- Paginated home feed (9 per page) with prefetching enabled by Next.js `<Link>`

### Likes and interactions

- Like / unlike published posts with instant optimistic UI (Zustand)
- Like counts displayed on post cards
- Unauthenticated like attempts show a sign-in prompt
- Duplicate likes prevented on the backend (`ALREADY_LIKED` / `NOT_LIKED`)

### Media and validation

- Image uploads are re-encoded to WebP on the server and written to `UPLOAD_DIR` (default `uploads/`), then served at `/uploads/<uuid>.webp`
- Uploads accept any browser-displayable image libvips can decode (JPEG, PNG, WebP, GIF, AVIF, TIFF, SVG), capped at 5 MB per request; stored files are kept under 1 MB
- Only the relative `/uploads/...` path is stored in Postgres, so the same row works on localhost, an EC2 DNS name or a custom domain
- Rollback: uploaded images are deleted if the database write fails; replaced and deleted posts remove their files from disk
- Request validation with Zod, centralized custom errors and error codes
- Centralized fetch client with error toasts for API and network failures

## Tech stack

| Technology          | Purpose                                    |
| ------------------- | ------------------------------------------ |
| Next.js 16         | Fullstack framework (App Router, Turbopack) |
| React 19           | UI library (Server + Client Components)    |
| TypeScript          | Static typing                              |
| Tailwind CSS v4     | Utility-first CSS                          |
| shadcn (Base UI)    | Component library                          |
| Prisma 7 + PostgreSQL | ORM and database                         |
| @prisma/adapter-pg  | Prisma PostgreSQL driver adapter          |
| sharp               | Server-side image compression (WebP)       |
| jose (JWT)          | Token creation and verification           |
| bcryptjs            | Password hashing                           |
| Zod                 | Request validation                         |
| Zustand             | Optimistic like state                      |
| Sonner              | Toast notifications                        |
| next-themes         | Dark / light theme switching               |

## Prerequisites

- Node.js 20.9+
- npm
- A PostgreSQL database, such as Supabase Postgres — or Docker (optional, see [Docker](#docker))

## Environment variables

Create `.env` from `.env.example`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
UPLOAD_DIR="uploads"
```

`UPLOAD_DIR` is where post images are written; it defaults to `uploads/` in the project directory and the Docker stack uses `/app/uploads`. Never expose `DATABASE_URL` or `JWT_SECRET` to the client.

## Run locally

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # then fill in your values
npm run db:migrate   # or: npx prisma migrate deploy (applies the copied migrations)
npm run dev
```

The app runs on http://localhost:3000 — the API and the UI are served from the same origin, so no CORS configuration is needed.

## Docker

A production-style stack (Next.js `standalone` image + Postgres + one-shot migrations) and an optional hot-reloading dev container are defined in `compose.yaml`.

```bash
npm run docker:up     # docker compose up --build  -> http://localhost:3000
npm run docker:logs   # follow the app logs
npm run docker:down   # stop, keep pgdata and uploads
npm run docker:reset  # stop AND DELETE the pgdata + uploads volumes (destructive)

npm run docker:db     # Postgres only, for `npm run dev` on the host
npm run docker:dev    # hot-reloading container on http://localhost:3001

npm run docker:backup # dump the database + uploads into ./backups
npm run docker:restore -- backups/db-<stamp>.sql.gz backups/uploads-<stamp>.tar.gz
```

How it fits together:

- `db` — `postgres:17-alpine` with a `pg_isready` healthcheck and the `pgdata` volume.
- `migrate` — one-shot `prisma migrate deploy` built from the Dockerfile `migrator` target. It runs once the database is healthy and exits; nothing else starts until it succeeds.
- `app` — built from the `runner` target (`node server.js` from `.next/standalone`), runs as the non-root `nextjs` user, and only starts after `db` is healthy and `migrate` has completed. It also has a healthcheck against `/v1`.
- `app-dev` — `docker compose --profile dev up` mounts the source tree and runs `next dev`; `node_modules`, `.next` and the generated Prisma client live in named volumes so your host tree stays clean.
- post images live in the `uploads` volume mounted at `/app/uploads`, so they survive rebuilds and are not baked into the image. The volume is a Docker object, so it outlives `docker compose down`, `docker rm` and `--build`; only `docker compose down -v` (or `docker volume rm` / `docker system prune --volumes`) deletes it.

### What deletes data, and how to back up

| Command | Containers | `pgdata` + `uploads` volumes |
| --- | --- | --- |
| `docker compose stop` / `restart` | kept | kept |
| `docker compose down` | removed | **kept** |
| `docker rm -f offscript-app-1` | removed | **kept** |
| `docker compose up --build` | recreated | **kept** |
| `docker compose down -v` (`npm run docker:reset`) | removed | **deleted** |
| `docker volume rm` / `docker system prune --volumes` | — | **deleted** |

`npm run docker:backup` writes a `pg_dump` and a tar of the uploads volume to `./backups/` (gitignored) while the stack keeps running; both files are verified before it reports success. `npm run docker:restore` puts them back and asks for confirmation, because it replaces database contents. Uploaded files added after a backup are left in place by a restore rather than deleted.

Caveat when running both surfaces: the container writes images to the `uploads` volume, while `npm run dev` on the host reads `./uploads`. An image uploaded through the container is therefore not visible to the host dev server, and vice versa. Use one surface at a time, or inspect/copy container-side files with `docker compose exec app ls -l uploads` and `docker compose cp app:/app/uploads/<file> ./uploads/`.

Configuration notes:

- This stack keeps the database **local to the deployment** (a Postgres container with the `pgdata` volume) rather than an external/RDS instance, so `pgdata` and `uploads` are the state to back up or move to persistent storage (e.g. an EBS mount) on AWS.
- The `db` port is published on `127.0.0.1` only, so the database is reachable from `npm run dev` on the host but not from the internet. Remove the `ports` entry entirely if you never run the dev server on the host.
- Compose reads the repo-root `.env` for `${VARS}` interpolation, so `JWT_SECRET` is picked up from there.
- `DATABASE_URL` inside the containers is built from `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` and always points at the `db` service — a hosted `DATABASE_URL` in `.env` is never used by the containers.
- Set `JWT_SECRET` before exposing the stack anywhere; the compose default is a deliberately insecure placeholder.
- Auth cookies are issued with `secure: true`, so sign-in works over `http://localhost` but not over a plain-HTTP LAN address.

## Image storage

Post images are stored on the server's own disk — no external bucket or credentials.

- `src/lib/storage.ts` re-encodes every upload with sharp: EXIF orientation applied, longest side capped at 1600 px, then WebP with a falling quality ladder until the file is under 900 KB. Encoding is single-threaded (`sharp.concurrency(1)`) so an upload cannot saturate a small instance.
- Files are written to `UPLOAD_DIR` (default `uploads/`) via write-then-rename, so a half-written file is never visible.
- `src/app/uploads/[...path]/route.ts` serves them at `/uploads/<uuid>.webp` with `immutable` caching. A route handler is used because Next snapshots `public/` at boot, which would 404 files uploaded while the server is running.
- The database stores only the relative path, so changing hostname, adding TLS or moving behind a proxy needs no data migration. Legacy files in `public/uploads` are still served.
- Deleting a post, or replacing its image, removes the previous file. Only `/uploads/...` paths are touched — absolute URLs from the old storage are left alone.

## Database and Prisma

The Prisma schema is located at `prisma/schema.prisma` and is identical to the original project (`User`, `Posts`, `Likes` models with `Role` and `Status` enums). The original migration history is preserved in `prisma/migrations`, so pointing `DATABASE_URL` at a fresh database and running `prisma migrate deploy` produces the exact same schema.

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy
npm run db:studio     # prisma studio
```

## API routes

The API lives under `/v1` and matches the original Express server exactly:

### Authentication

| Method  | Route        | Auth     |
| ------- | ------------ | -------- |
| `POST`  | `/v1/signup` | Public   |
| `POST`  | `/v1/signin` | Public   |
| `GET`   | `/v1/me`     | Required |
| `POST`  | `/v1/logout` | Required |

### Posts

| Method   | Route                          | Auth      |
| -------- | ------------------------------ | --------- |
| `GET`    | `/v1/posts`                    | Public    |
| `GET`    | `/v1/posts/:id`                | Public    |
| `POST`   | `/v1/post`                     | Required  |
| `PUT`    | `/v1/posts/:id`                | Required  |
| `DELETE` | `/v1/post/:id`                 | Required  |
| `GET`    | `/v1/user/posts/unpublished`   | Required  |
| `GET`    | `/v1/user/posts/published`     | Required  |
| `GET`    | `/v1/search/posts`             | Public    |
| `GET`    | `/v1/user/search/posts`        | Required  |
| `POST`   | `/v1/posts/:id/like`           | Required  |
| `DELETE` | `/v1/posts/:id/dislike`        | Required  |

### Admin

| Method   | Route                          | Auth           |
| -------- | ------------------------------ | -------------- |
| `GET`    | `/v1/admin/posts/pending`      | Admin          |
| `PUT`    | `/v1/admin/posts/:id/status`   | Admin          |
| `DELETE` | `/v1/admin/posts/:id`          | Admin          |

### Health

| Method | Route  | Auth   |
| ------ | -----  | ------ |
| `GET`  | `/v1` | Public |

Error responses use the same shape as the original error handler: validation failures return `400 { message, Errors }`, custom errors return `{ message, errCode }`, and anything unexpected returns `500 { message: "Something went wrong", errCode: "SE500" }`.

---

Built with care by [Ujjwal](https://github.com/ujjwal-py) · [View more projects on GitHub](https://github.com/ujjwal-py)
