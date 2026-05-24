@AGENTS.md

# Gestão de Diaristas (Pizzarias RWP)

Web app to manage day workers ("diaristas") across pizza stores: worker
registration, store registration, weekly scheduling, attendance/check-in, and
payments. Mobile-first PWA, used on phones and desktop.

**Language:** the entire codebase is in Brazilian Portuguese (pt-BR) — identifiers,
comments, UI strings, commit messages. Match this when writing new code. Domain
terms below keep their Portuguese names because that is what the code uses.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions) + **React 19**.
- **Prisma 6** ORM against **PostgreSQL**.
- **Tailwind CSS v4** (via `@tailwindcss/postcss`).
- **web-push** (VAPID) + optional Telegram bot for notifications.
- **Supabase Storage** (REST) for photo uploads; deployed on **Vercel**.
- TypeScript strict mode. Path alias `@/*` → `src/*`.

> ⚠️ Per AGENTS.md, this is a newer Next.js than your training data. Before writing
> framework code, read the relevant guide in `node_modules/next/dist/docs/` and heed
> deprecation notices. (`node_modules` only exists after `npm install`.)

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | install deps (runs `prisma generate` via `postinstall`) |
| `npm run dev` | dev server at http://localhost:3000 |
| `npm run build` | `prisma generate && prisma migrate deploy && next build` |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run db:seed` | load fictional example data (`prisma/seed.ts`) |
| `npx prisma migrate dev` | create/apply migrations locally |
| `npx prisma studio` | browse/edit the DB |

There is **no test suite**. Validate changes with `npm run lint`, `npm run build`,
and by exercising the relevant flow in the browser.

## Architecture — three user areas

The app serves three distinct audiences, separated by route group and protected by
the layout that wraps each:

1. **Gestão / internal team (RH & TI)** — `src/app/(app)/**`
   - Layout `src/app/(app)/layout.tsx` requires `sessao.tipo === "gestao"`, else
     redirects to `/entrar`. Bottom-nav app shell.
   - Pages: `escala` (schedule), `requisicoes` (store requests), `diaristas`,
     `lojas`, `pagamentos`, `bonificacoes`, `gestores`, `equipe`, `usuarios`,
     `mensagens` (chat), `sugestoes`, `solicitacoes`, `valores-funcao`.
   - `perfil`: `"rh"` (operations) or `"ti"` (admin — only TI creates/deletes
     stores and manages users).

2. **Loja / store owner & manager** — `src/app/loja/**`
   - Layout `src/app/loja/layout.tsx` requires a loja/gestor session via
     `contextoLoja()`. A *gestor* may manage several stores (M2M) and switch with
     `/loja/trocar`.
   - Stores create `Requisicao` (requests for workers); RH fulfills them.

3. **Diarista / the worker** — `src/app/d/[token]/**`
   - Accessed by a **personal token link** (`Diarista.token`), no login required for
     first access. They see their agenda, confirm presence, check in (geo), rate
     stores, set preferred stores, chat with RH.

**Public / cross-cutting routes** (`src/app/*`): `entrar` (login hub for all
profiles), `sou-diarista` (worker self-signup), `solicitar-acesso` (manager
self-signup, approved by RH/TI), `definir-senha/[token]` & `recuperar-senha`
(password set/reset via secret link), `confirmar/[token]` (public shift
confirmation), `ranking`, plus API routes under `src/app/api/`.

## Auth & sessions (`src/lib/auth.ts`)

- Stateless session in a **signed cookie** (`sessao`), HMAC-SHA256 over a base64url
  JSON payload. No server-side session store.
- `Sessao` is a discriminated union on `tipo`:
  `"gestao"` | `"loja"` | `"gestor"` | `"diarista"`.
- Helpers: `getSessao()`, `setSessao()`, `limparSessao()`, `contextoLoja(s)`
  (normalizes loja/gestor → `{ lojaId, gestorId }`).
- Layouts do the gatekeeping (call `getSessao()` and `redirect("/entrar")`); there is
  **no middleware**. When adding a protected page, place it under the right route
  group so the layout guard applies, or check the session in the page.
- Passwords: scrypt hash stored as `"salt:hash"` (`src/lib/senha.ts`). A stored value
  **without** a `:` means "no password yet" → first access is only via the secret
  `tokenSenha` link (sent over WhatsApp). `conferirSenha` uses `timingSafeEqual`.
- `SESSION_SECRET` **must** be set in production — otherwise sessions are forgeable
  and the app shows a red warning banner (`sessionSecretInseguro()`).
- ⚠️ `entrarConfiguracao()` in `src/app/entrar/actions.ts` is a **temporary
  passwordless RH login** for the rollout phase. It is an open door — remove it once
  real login is fully in place.

## Data & domain conventions (critical)

- **Money is stored in integer CENTAVOS** everywhere (`valor`, `valorDiaria`,
  `valorPago`, etc.). Never use floats for money. Convert with
  `formatBRL(centavos)` and `parseBRLToCents(text)` from `src/lib/format.ts`.
- **Work dates are strings `"AAAA-MM-DD"`** (not `DateTime`) to dodge timezone bugs.
  All date math lives in `src/lib/dates.ts` (`hojeISO`, `addDias`, `inicioDaSemana`,
  `isISODate`, `dentroDaJanelaAgendamento`, `turnoFinalizado`, …). The week starts
  **Monday**. `DateTime` columns (`criadoEm`, `checkinEm`, …) are real timestamps.
- Schema lives in `prisma/schema.prisma`; read its inline comments — they encode the
  business rules. Key models: `Loja`, `Gestor`, `Membro` (RH/TI), `Diarista`,
  `Escala` (a single shift), `Requisicao` (store's request) + `Inscricao` (worker
  application), `Convocacao` (direct call-up), `Avaliacao` (worker rating, now 1–5
  stars) & `AvaliacaoLoja` (store rating — visible to RH only), `Bloqueio` (blocks),
  `Bonificacao`, `Mensagem` (RH↔worker chat), push tables, `ValorFuncao`.

### Business rules to respect

- **One shift per worker per day**: `Escala` has `@@unique([diaristaId, data])`.
- **Max 2 shifts/week at the *same* store** unless `Loja.permiteMais2Semana`
  (labor-law guardrail) — enforce via `podeMaisUmaNaSemana()` (`src/lib/limites.ts`).
- **Scheduling window**: today → at most 7 days ahead (`dentroDaJanelaAgendamento`).
- Accepting a worker for a day **clears their other pending applications that day**
  (`limparOutrasInscricoesDoDia`, `src/lib/escalas.ts`).
- A worker can cancel only until **4h before** the shift (`podeDesistir`).
- Cannot delete a shift that is past or already realized (check-in/PRESENTE).
- Cron `/api/cron/checkout` (Vercel cron every 15 min, see `vercel.json`) auto
  checks-out finished shifts, sets `valorPago`, marks no-shows as `FALTOU`, and
  notifies the store to pay. Protected by `CRON_SECRET` when set.
- Payments are visible to gestor/RH only (lojista does not see Pix or "mark paid").
- Brand/badge detection from store name in `src/lib/marcas.ts` (iFood-style seals).

## Server Actions pattern

Mutations are **Server Actions** (`"use server"`), colocated as `actions.ts` next to
the page (e.g. `src/app/(app)/escala/actions.ts`). Conventions seen throughout:

- Read inputs from `FormData` with `String(formData.get("x") ?? "")`; validate
  early and **return silently** on bad input (or `redirect(...?erro=...)`).
- Use the shared `prisma` client from `src/lib/prisma.ts` (never `new PrismaClient()`
  in app code — only seed scripts do that).
- After writes, call `revalidatePath(...)` for every affected route, then optionally
  `redirect(...)`.
- Side effects (push/Telegram) go through `src/lib/push.ts` / `src/lib/telegram.ts`
  and must never throw into the request flow (they swallow/log errors).

## UI conventions

- Shared primitives in `src/components/ui.tsx`: `Card`, `PageHeader`, `EmptyState`
  and class constants `inputClass`, `labelClass`, `btnPrimary`, `btnSecondary`,
  `btnDanger`. Reuse these instead of re-styling.
- Server Components by default; add `"use client"` only when you need interactivity
  (see `BottomNav`, upload/geo components).
- Tailwind v4, mobile-first, `max-w-2xl` centered shell. Accent color is orange;
  PWA theme color teal (`#0f766e`). Root layout sets `lang="pt-BR"`.
- It's a PWA: `src/app/manifest.ts`, `public/sw.js`, install-to-home-screen.

## Project layout

```
prisma/
  schema.prisma            # data model + business-rule comments
  migrations/              # SQL migrations (timestamped)
  seed.ts / seed.demo.ts   # FICTIONAL example data
src/
  app/
    (app)/                 # RH/TI area (layout-guarded)
    loja/                  # store owner/manager area
    d/[token]/             # worker personal-link area
    entrar/, sou-diarista/, solicitar-acesso/, definir-senha/, confirmar/ ...
    api/cron/checkout/, api/telegram/webhook/
    layout.tsx, manifest.ts, globals.css
  components/              # shared React components (ui.tsx, BottomNav, ...)
  lib/                     # pure helpers + integrations (auth, prisma, dates,
                           #   format, senha, push, telegram, storage, limites, ...)
  types/, web-push.d.ts
```

## Environment variables

See `.env.example`. Key ones:

- `POSTGRES_PRISMA_URL` (pooled, runtime) and `POSTGRES_URL_NON_POOLING` (direct, for
  migrations) — auto-created by the Vercel + Supabase integration. Locally they can be
  identical.
- `SESSION_SECRET` — **required in prod** (signs the session cookie).
- `RH_SENHA` / `TI_SENHA` — gestão passwords (default `123456`).
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — web push
  (generate with `npx web-push generate-vapid-keys`).
- `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT` — optional Telegram notifications.
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY` — photo
  uploads (`src/lib/storage.ts`, bucket `fotos`).
- `CRON_SECRET` — optional auth for the checkout cron.

## Deployment & data

- Vercel auto-deploys on push. The build runs `prisma migrate deploy`, so committing a
  migration applies it on the next deploy. Use `npx prisma migrate dev` locally to
  generate migrations — don't hand-edit the DB.
- **Real production data is NOT in Git.** `.gitignore` excludes `prisma/seed.real.ts`
  and `prisma/*.local.*`. `npm run db:seed` only loads fictional examples.

## Conventions for changes here

- Keep money in centavos and work dates as `"AAAA-MM-DD"` strings — don't introduce
  floats or `Date` for scheduling.
- Put new mutations in a colocated `actions.ts`; reuse helpers in `src/lib` rather than
  duplicating date/money/auth logic.
- Match the existing Portuguese naming and the AGENTS.md Next.js guidance.
- After changes, run `npm run lint` and `npm run build`; manually verify the flow in
  the browser (no automated tests exist).
