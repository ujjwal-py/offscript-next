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
│   ├── lib/                 # Config, auth, prisma, supabase, validation, services
│   │   └── services/        # Controller logic shared by pages and route handlers
│   ├── store/               # Zustand store (optimistic likes)
│   ├── generated/prisma/    # Generated Prisma client (not committed)
│   └── proxy.ts             # Optimistic route protection (my-posts, profile, admin)
├── next.config.ts
├── prisma.config.ts
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

- Image uploads stored in Supabase Storage (JPEG, PNG, WebP, 5 MB limit)
- Rollback: uploaded images are deleted if the database write fails; replaced images are cleaned up on edit
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
| Supabase JS         | Supabase Storage integration               |
| jose (JWT)          | Token creation and verification           |
| bcryptjs            | Password hashing                           |
| Zod                 | Request validation                         |
| Zustand             | Optimistic like state                      |
| Sonner              | Toast notifications                        |
| next-themes         | Dark / light theme switching               |

## Prerequisites

- Node.js 20.9+
- npm
- A PostgreSQL database, such as Supabase Postgres
- A Supabase project if image storage is enabled

## Environment variables

Create `.env` from `.env.example`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-side-service-role-key"
SUPABASE_BUCKET="your-storage-bucket-name"
```

The app runs without Supabase configured — only image uploads require it (`SUPABASE_CONFIG_ERROR` otherwise). Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` or `JWT_SECRET` to the client.

## Run locally

```bash
npm install          # also runs `prisma generate` via postinstall
cp .env.example .env # then fill in your values
npm run db:migrate   # or: npx prisma migrate deploy (applies the copied migrations)
npm run dev
```

The app runs on http://localhost:3000 — the API and the UI are served from the same origin, so no CORS configuration is needed.

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
