# にほんご SaaS — Boilerplate

Boilerplate lengkap platform belajar bahasa Jepang (JLPT/JFT).

## Stack

| Layer | Teknologi |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Fastify 4 + TypeScript |
| ORM | Prisma 5 + PostgreSQL (Supabase) |
| Cache | Redis (Upstash / Docker) |
| Auth | JWT + httpOnly Cookie + Google OAuth |
| Frontend | Next.js 14 App Router + TailwindCSS |
| State | Zustand (sessionStorage) |
| HTTP Client | Axios + auto-refresh interceptor |
| Validation | Zod + React Hook Form |
| CI/CD | GitHub Actions + Vercel + Railway |

## Struktur

```
nihongo-saas/
├── apps/
│   ├── api/                    ← Fastify backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← Database schema lengkap
│   │   │   └── seed.ts         ← Data awal
│   │   └── src/
│   │       ├── index.ts        ← Entry point
│   │       ├── plugins/        ← prisma, redis, jwt, cors
│   │       ├── routes/         ← auth, users, onboarding, content, srs
│   │       └── services/       ← auth.service, srs.service
│   └── web/                    ← Next.js frontend
│       └── src/
│           ├── app/            ← Pages (login, register, dashboard)
│           ├── components/     ← UI, Auth, Layout
│           ├── hooks/          ← useAuth
│           ├── lib/            ← api.ts, validations.ts
│           └── store/          ← auth.store (Zustand)
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Setup Cepat

### 1. Prerequisites
```bash
node >= 20
pnpm >= 9
docker & docker compose
```

### 2. Install
```bash
# Clone atau extract project
cd nihongo-saas

# Install semua dependencies
pnpm install
```

### 3. Environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` — isi minimal:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nihongo_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/nihongo_dev"
REDIS_URL="redis://:nihongodev@localhost:6379"
JWT_SECRET="dev-secret-min-32-chars-ganti-di-prod"
COOKIE_SECRET="dev-cookie-min-32-chars-ganti!!"
```

### 4. Database
```bash
# Jalankan PostgreSQL + Redis lokal
docker compose up -d

# Push schema
pnpm db:push

# Seed data awal
pnpm db:seed
```

### 5. Jalankan
```bash
pnpm dev
# API  → http://localhost:3001
# Web  → http://localhost:3000
```

## API Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout
GET    /auth/google
GET    /auth/google/callback
GET    /auth/me

GET    /users/me
PATCH  /users/me
GET    /users/me/stats

GET    /onboarding/placement/questions
POST   /onboarding/placement/submit
POST   /onboarding/study-plan
GET    /onboarding/study-plan

GET    /content/vocabulary
GET    /content/vocabulary/:id
GET    /content/kanji
GET    /content/kanji/:character
GET    /content/grammar
GET    /content/lessons
GET    /content/lessons/:id
POST   /content/lessons/:id/complete

GET    /srs/due-today
POST   /srs/review
GET    /srs/stats

GET    /health
```

## Akun Demo (setelah seed)
```
Admin : admin@nihongo.id / admin123!
User  : demo@nihongo.id  / demo123!
```

## Deploy

**Frontend → Vercel**
- Connect GitHub repo
- Root directory: `apps/web`
- Framework: Next.js

**Backend → Railway**
- Connect GitHub repo
- Root directory: `apps/api`
- Start command: `node dist/index.js`
- Build command: `pnpm build`
