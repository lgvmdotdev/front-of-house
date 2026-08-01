# apps/dashboard — handoff

A new Next.js app serving two audiences from one codebase: the barbershop owner's
panel (`app/(app)/*`) and the internal Recepcionai panel (`app/(admin)/admin/*`).
Nothing in `apps/web`, `apps/whatsapp-*`, `packages/db` or `packages/auth` was
modified. Dev/start on port **3001**.

- 18 routes. All tenant-facing strings pt-BR.
- Screenshots for every phase gate: `.verification/`.

> **Superseded in places.** The app has since been restructured onto the
> feature-sliced RSC architecture: `lib/` no longer holds domain logic, pages are
> synchronous composition surfaces, and each screen streams behind its own
> Suspense boundary. [ARCHITECTURE.md](./ARCHITECTURE.md) is the current
> description of the layout and the reasoning; the sections below are marked
> where they no longer hold.

---

## 1. What was built

### Tenant panel — `app/(app)/`, all org-scoped

| Route | Entity | Notes |
|---|---|---|
| `/painel` | overview | catalog + conversation counts, WhatsApp connection badge |
| `/servicos` | `service` | full CRUD: name, duration, price (cents), active |
| `/profissionais` | `professional`, `professional_service`, `working_hours` | full CRUD; multi-service selection; split shifts; overlap rejected |
| `/conversas` | `conversation` | read-only list, filter by `open` / `handed_off` / `closed` |
| `/conversas/[id]` | `conversation_message` | read-only transcript, customer vs agent |
| `/integracao` | `integration_settings` | provider, `spreadsheetId`, `offsetMinutes` (upsert, one row per org) |
| `/whatsapp` | `whatsapp_channel` | **read-only** (see assumptions) |
| `/equipe` | `member`, `invitation` | list, invite, change role, revoke, remove |
| `/configuracoes` | `organization` | name, slug, logo |
| `/sem-barbearia` | — | signed-in user with no organization |

### Admin panel — `app/(admin)/admin/`, cross-tenant

| Route | Notes |
|---|---|
| `/admin` | platform totals, recent tenants, "no WhatsApp connected" list |
| `/admin/barbearias` | tenant list with per-tenant member/catalog/conversation counts + channel |
| `/admin/barbearias/[id]` | detail: members, pending invitations, catalog counts, channel, integration, recent conversations |
| `/admin/usuarios` | list with memberships; ban/unban, internal role, impersonate |

### Architecture as implemented

Still true:

- **Tenancy from the session, never the URL.** `lib/session.ts` is the only place
  that decides which barbershop you are in. No `(app)` page accepts an org id.
- **Every org-scoped query takes `organizationId` as its first argument** and
  filters on it. Mutations return `false` rather than throwing when nothing
  matched, so a foreign id is indistinguishable from a missing one. Cross-tenant
  reads are covered by tests.
- **Cross-tenant reads are quarantined** in the two admin-only features
  (`features/tenant/`, `features/user/`) — the only queries without an org
  filter, imported exclusively from `(admin)`. The per-tenant detail view reuses
  the org-scoped queries instead of duplicating them.
- **Mutations are server actions** returning `ActionResult`
  (`lib/action-result.ts`), zod-validated at the boundary, then `revalidatePath`.
- **Admin gating** is `requireAdmin()` → `forbidden()` → real 403 page.
  `proxy.ts` only does the cheap cookie check.

Changed — see [ARCHITECTURE.md](./ARCHITECTURE.md):

- **Queries and actions moved out of `lib/` and `app/**/_actions/`** into
  `features/<domain>/`. The three god-files (`catalog.ts`, `tenant.ts`,
  `admin.ts`) are gone; `lib/` keeps only non-domain helpers.
- **`lib/use-action.ts` no longer calls `router.refresh()`.** The actions'
  `revalidatePath` calls already cover every affected screen, and a server action
  that revalidated the current route returns the fresh payload with its own
  response. It also accepts `successMessage: null` for the mutations where a
  `useOptimistic` update is the feedback.
- **`app/error.tsx` is now the last resort, not the only boundary.** Each
  fallible section is wrapped in `components/ui/section-error.tsx` (`catchError`
  from `next/error`), so one failed read no longer takes the screen with it.
  Keeping the route-level boundary at the root still matters for the same reason
  as before: it is what catches `requireActiveOrg` / `requireAdmin` failures in
  the group layouts.
- **Both `loading.tsx` files were deleted.** They existed to stop a blocking
  async page from painting nothing; now that pages are synchronous, a generic
  full-area skeleton only pre-empts the real shell they were compensating for.

---

## 2. Added to `packages/ui`

**One primitive: `checkbox`** (`packages/ui/src/components/checkbox.tsx`), added
with the shadcn CLI run from `packages/ui` so it inherited `radix-nova` +
`remixicon` and imports from the `radix-ui` barrel. Zero new dependencies. No
existing primitive was edited — verified byte-identical against `main`.

Deliberately **not** added, because they compose from what exists:

| Wanted | Used instead |
|---|---|
| `switch` | `checkbox` — same semantics inside a form that saves on submit |
| `textarea` | nothing in this app is multi-line |
| `form` | `<form action>` + zod server-side; adding it drags in react-hook-form |
| `alert-dialog` | `components/ui/confirm-button.tsx` over `Dialog` + `role="alertdialog"` + autofocused Cancel |
| `tabs` | route segments (tenant detail stacks Cards instead) |
| `empty` | `components/ui/empty-state.tsx`, ~12 lines |
| `calendar`/`date-picker` | native `<input type="time">` |
| `alert`, `breadcrumb`, `pagination`, `spinner`, `scroll-area` | layout utilities |

---

## 3. Next.js 16.x features — adopted / rejected

Checked against the **bundled docs of the pinned version**
(`node_modules/next/dist/docs/`), not the blog posts. Two blog-era details were
already stale: `error.tsx`'s retry prop is stable **`retry`** in 16.3 (it was
`unstable_retry` in 16.2), and `export const prefetch`'s documented values are
`'partial' | 'force-disabled' | 'auto'`.

| Feature | Verdict | Why |
|---|---|---|
| `proxy.ts` (was `middleware.ts`) | **adopt** | `middleware.ts` is deprecated in 16; same API, current name |
| `typedRoutes` | **adopt** | caught three wrong `href`s during the build; gives `PageProps<'/conversas/[id]'>` for free |
| `PageProps<>` globals | **adopt** | replaces hand-written `params: Promise<{id:string}>` |
| `experimental.authInterrupts` + `forbidden()` | **adopt** | `/admin` returns a real **403**, not a silent redirect. Verified: `GET /admin 403` |
| `loading.tsx` per route group | ~~adopt~~ → **removed** | was the instant-navigation win while pages blocked on a query. Synchronous pages + per-section `<Suspense>` do it better: the header, filters and buttons are real, not a grey block. See ARCHITECTURE.md Part 3 |
| `<Suspense>` per section + sibling skeletons | **adopt** | replaces the above. 18 boundaries across 13 pages |
| `catchError` (stable in 16.3) | **adopt** | `components/ui/section-error.tsx`. Verified it still lets `forbidden()` reach the 403 page and `notFound()` reach the 404 page |
| `useLinkStatus` | **adopt** | drives `data-pending` on the conversation filters. A local `useTransition` around an optimistic setter settles in the same tick, so its `isPending` was useless for dimming |
| React `cache()` | **adopt** | session helpers and the reads that two components now share in one render. Not "just in case" — each one has a real second caller |
| `error.tsx` with stable `retry()` | **adopt** | re-fetches and re-renders; `reset()` would replay the same failed read |
| `data-scroll-behavior="smooth"` on `<html>` | **adopt** | `packages/ui` sets `scroll-behavior: smooth`; Next 16 stopped overriding it during transitions unless opted in, and warns in dev |
| Turbopack (default) + `turbopackMemoryEviction` | **adopt (default)** | on by default; no config |
| `reactCompiler` | **adopt** | matches `apps/web`; build verified green with it on |
| DevTools MCP / `/_next/mcp` | **adopt (tooling)** | used during development |
| **`cacheComponents`** | ~~reject~~ → **deferred** | The "architecturally incompatible" reasoning was wrong: hoisting the org id into a private cached function is exactly how the reference apps solve it (`getFeed()` → `getFeedForHandle(handle, …)`, session reads via `'use cache: private'`). What still stands is the *value* argument — caching 3 ms org-scoped queries in a write-heavy panel buys nothing. The reason to revisit is the static shell, not query cost. See ARCHITECTURE.md Part 5 |
| `"use cache"`, `cacheLife`, `cacheTag`, `updateTag` | **deferred** | all gated on `cacheComponents` |
| `partialPrefetching`, `export const instant`/`prefetch`, `cachedNavigations` | **deferred** | documented as requiring `cacheComponents`; config validation rejects `partialPrefetching` without it |
| `refresh()` (new in 16.3) | **reject** | verified present in `next/cache`, but redundant here — `revalidatePath` already invalidates the client router cache for the affected paths. Confirmed empirically over CDP: create a service and the row plus the overview count both update with no reload, now that `router.refresh()` is gone too |
| `turbopackFileSystemCacheForBuild` | **reject** | only pays off if CI persists `.next`; it does not |
| `inlineCss`, `useLightningcss`, `sri`, per-link `prefetch` tuning | **reject** | public-web page-weight tuning for an authenticated internal panel |
| `after()`, `connection()` | **reject** | no background work. `after()` is the right tool if audit logging lands (see gaps) |

Stale-data gate: after creating a service, a **client-side** navigation to
`/painel` shows the new count immediately. Mutation actions invalidate all three
affected paths themselves (`revalidateCatalog()`) rather than relying on the
component's `router.refresh()`.

---

## 4. Assumptions taken

1. **`activeOrganizationId` is resolved from membership when the session has
   none.** better-auth only populates it via onboarding or an explicit
   `setActive`, so seeded and impersonated sessions have it `null` and every
   tenant screen would otherwise be unreachable. Resolved with a read-only
   `member` lookup — no session mutation during render (which would be an illegal
   cookie write in a server component). Every better-auth organization call
   therefore passes `organizationId` explicitly; verified that
   `orgSessionMiddleware` only requires a session, not an active org.
2. **`/` routes by role** — admins to `/admin`, everyone else to `/painel`.
   Without this an admin (who owns no barbershop) lands on `/sem-barbearia`.
   The tenant overview is `/painel`, since `/` is the router.
3. **`/sem-barbearia` lives outside `(app)`** — inside it, the group layout's
   `requireActiveOrg` would redirect to it forever.
4. **`/admin/barbearias`**, not `/admin/tenants` — pt-BR, per the language rule.
5. **`proxy.ts` matcher is deny-by-default** (`/((?!login|api|_next/...).*)`), so
   a route added later is protected the moment it exists.
6. **The WhatsApp screen is read-only.** The channel maps an inbound Meta
   `phone_number_id` to an organization; letting a tenant edit it would let them
   claim another shop's inbound messages.
7. **Team reads use drizzle, team mutations use better-auth.** Reads need a join
   onto `user` that `listMembers` cannot do; mutations need better-auth's
   invitation token/expiry and `sendInvitationEmail`.
8. **The organization profile is written with drizzle**, not
   `auth.api.updateOrganization`, which resolves its target from the session's
   active organization (see 1). Slug collisions are checked before writing.
9. **Admin-created tenants always create a fresh owner user.** `organizationLimit: 1`
   is enforced *after* better-auth's server-only branch, so it is not bypassed —
   reusing an existing owner would 403. The action refuses an existing e-mail with
   a clear message and rolls the new user back if org creation then fails.
10. **Test isolation is throwaway-org + cascade delete**, the pattern already in
    `apps/web/lib/catalog.test.ts`, rather than transaction rollback. Rollback
    would mean threading a `tx` handle through every query signature for
    tests only; deleting the organization cascades away every catalog,
    conversation, channel and membership row, which is exactly the blast radius
    of an org-scoped test. Absolute-total assertions are written as deltas so
    they tolerate seed data.
11. **`.env` does not set `NODE_ENV`** — see known issue 1; this is a deviation
    from `apps/web/.env`'s shape and it is deliberate.
12. **Two dependencies beyond the allowed list**, both justified:
    - `better-auth` (direct) — `lib/auth-client.ts` must import
      `better-auth/react` rather than the `@workspace/auth` barrel. That barrel
      evaluates `betterAuth()`, and therefore `@workspace/env` and
      `@workspace/db`, at module load; in the browser `process.env` is empty and
      it throws. **`apps/web/lib/auth.ts` has this same latent bug** — its login
      form would fail to hydrate for the same reason. Not fixed here (out of
      scope), reported below.
    - `@workspace/bookings` (workspace) — reuses `timeOfDaySchema` instead of
      re-declaring the `HH:MM` regex. The `/types` subpath is zod-only.
13. Overlap validation is a new rule (`lib/working-hours.ts`): two windows on the
    same weekday may touch (`…12:00` / `12:00…`, end is exclusive) but not
    overlap. `apps/web` has no such check.

---

## 5. Schema gaps found

The schema is frozen, so these are recorded, not worked around.

1. **No appointments/bookings table.** Bookings live in the shop's own tool
   (Sheets/Calendar) via `@workspace/bookings`, so the panel cannot show
   upcoming appointments — arguably the screen an owner wants most. Would need
   either a read-through to the booking engine or a local projection table.
2. **No audit log.** Ban, unban, role change and impersonation leave no trace
   beyond `session.impersonatedBy`. For an internal panel with impersonation this
   is the most significant gap. `after()` + an `admin_audit` table would cover it.
3. **`whatsapp_channel` has no health or credential columns** (the table's own
   comment flags the future per-row `accessToken`). The screen can show the
   mapping and nothing about whether the number actually works.
4. **`conversation` has no assignee or handed-off timestamp.** `handed_off` says
   a human is needed but not who or since when, so no queue view is possible.
5. **`member.role` and `invitation.role` are free-text**; the UI constrains them
   to better-auth's `owner`/`admin`/`member`. `invitation.role` is also nullable,
   rendered as `—`.
6. **No per-service or per-professional ordering column**, so lists are
   alphabetical; the shop cannot choose the order the agent offers services in.
7. **`organization.metadata`** (text) is unused — no place yet for per-shop agent
   configuration such as tone or opening-hours copy.

---

## 6. Seeded credentials

`bun run seed` in `apps/dashboard` — idempotent, verified by running twice and
counting rows.

| Role | E-mail | Password |
|---|---|---|
| Internal admin (`user.role = "admin"`) | `admin@recepcionai.test` | `Admin123!` |
| Owner of *Barbearia Demo* | `dono@barbearia-demo.test` | `Dono123!` |

Also seeded: **Barbearia Demo** (`barbearia-demo`), 3 services, 2 professionals
(Felipe with Tue–Fri split shifts, Bruno with three straight days), service
links, `integration_settings` (`sheets`), one `whatsapp_channel`, and 2
conversations with 6 messages.

How it stays idempotent: rows whose ids the seed controls use stable `seed-*` ids
with `onConflictDoUpdate`; users and the organization are looked up by their
natural key (e-mail / slug) first. Users are created with
`auth.api.createUser` — the one admin endpoint that skips auth when called with
no `headers`, and it hashes the password and links the `credential` account.
Working-hours rows have no natural key, so the seed owns that set outright and
rewrites it. Pre-existing non-seed rows in the demo org are left alone.

---

## 7. Known issues

1. **`NODE_ENV` must not be pinned in `.env`.** With `NODE_ENV=development` set,
   `next build` prerenders Next's internal `/_global-error` page against a
   development React and dies with
   `TypeError: null is not an object (evaluating '…useContext')`.
   **This is the exact "pre-existing `/_global-error` failure" attributed to
   `apps/web`, and it is an env misconfiguration rather than a Next or Bun bug** —
   `apps/web/.env` line 1 is `NODE_ENV=development`. Removing that line should
   fix `apps/web`'s build too; not done here (out of scope). `next dev`,
   `next build`, `next start` and `bun test` all set the right value themselves;
   only package.json scripts need it, hence `"seed": "NODE_ENV=development …"`.
2. **Dev-time Postgres connection exhaustion.** After a long session with many
   Fast Refresh cycles the dev server had leaked ~85 idle connections and
   everything started failing with `sorry, too many clients already` (99/100
   used; back to 14 the moment the server stopped). `packages/db` creates a
   client at module scope *and* exports `createDb()`, which `@workspace/auth`
   calls again, and Turbopack re-evaluates those modules on reload. Workaround:
   restart the dev server. The fix belongs in `packages/db` (a cached singleton),
   which is frozen for this task.
3. **`apps/web` does not typecheck or build on `main`, independently of this
   work.** `apps/web/app/page.tsx` imports 13 modules under
   `@/components/sections/*` and `@/components/site/*` that are **not tracked in
   git** — the landing-page commit appears to be partial. `git diff main...HEAD`
   shows this branch touches no file under `apps/web`. Consequence: `bun run
   typecheck` from the repo root fails on `web#typecheck`. Everything else is
   clean (`turbo typecheck --filter=dashboard --filter=@workspace/ui …` passes).
4. **`SidebarTrigger` in `packages/ui` renders `<button>` with no explicit
   `type`**, so it defaults to `submit`. Harmless where this app uses it (layout
   header, outside any form), but placed inside a form it would submit it. It
   also cost real debugging time here: a selector looking for the page's submit
   button matched the sidebar trigger first. Cannot be fixed without editing an
   existing primitive.
5. **Turbopack dev occasionally misses a newly created `page.tsx`.** Hit once
   with `app/(admin)/admin/page.tsx`: `/admin` was absent from the generated
   `routes.d.ts` while its own children were present. `touch` on the file fixed
   it.
6. **Root `bun test` needs env vars.** Tests are per-app (each app loads its own
   `.env`). From the repo root, 9 DB-backed suites fail on env validation —
   pre-existing, and it affects `apps/web`, `apps/whatsapp-worker`,
   `packages/bookings` and `packages/agent` identically. With env exported, all
   287 pass.
7. **After restarting the dev server, hard-reload the browser once.**
   `reactCompiler: true` + `transpilePackages: ["@workspace/ui"]` means the
   compiler rewrites `packages/ui`'s client components and injects a
   `react/compiler-runtime` import. A browser holding chunks from the *previous*
   dev server then throws
   `Module …/react/compiler-runtime.js … was instantiated because it was required
   from packages/ui/src/components/sonner.tsx, but the module factory is not
   available`. A worse variant of the same staleness leaves a page **rendered but
   never hydrated** — buttons carry no `__reactProps`, so nothing responds to a
   click, and no error is logged anywhere. Both clear up by deleting `.next` and
   the d3k Chrome profile (`~/.d3k/<project>/chrome-profile`) before restarting;
   bisected against `HEAD` to confirm it is environmental, not a code change.
   Drop `reactCompiler` if it ever shows up on a genuinely clean start.
8. **d3k needs a Chromium binary and direct routing.** No Chrome/Chromium is
   installed on this machine (only Arc, which refuses remote debugging), so
   verification used the Playwright cache's Chrome for Testing via `--browser`.
   Portless routing must be off (`--no-portless`): better-auth validates the
   `Origin` header against `BETTER_AUTH_URL`, and `http://dashboard.localhost:1355`
   makes every sign-in fail with `Invalid origin`.
9. **d3k v0.0.178 will not start here at all.** It dies in its own
   `autoInstallSkills` with `TypeError: undefined is not an object (evaluating
   'this.options')` before touching the browser, regardless of flags. The
   architecture pass was verified by driving the Playwright cache's Chrome for
   Testing directly over CDP instead (`--headless=new
   --remote-debugging-port=9222`), which needs no extra dependency. Retry d3k
   after an upgrade.
10. **A missing id on the two detail routes returns 200, not 404** — the 404
    *page* renders, but a synchronous page has already committed its response by
    the time the boundary calls `notFound()`, and `generateMetadata` streams too.
    Deliberate; reversible per-route by awaiting the read in the page body. See
    ARCHITECTURE.md Part 3.

---

## 8. Verification

Every phase gate was driven in the d3k-managed browser; screenshots in
`.verification/`.

| Gate | Evidence |
|---|---|
| 1 — scaffold | `phase1-login.png` — page on :3001 rendering a `@workspace/ui` `Button` with the mint primary token |
| 2 — auth + shell | `phase2-signed-out-redirect.png`, `phase2-non-admin-403.png` (server log: `GET /admin 403`) |
| 3 — seed | ran twice, row counts identical; confirmed via TablePro |
| 4 — admin | `phase4-*.png` — created *Barbearia Navalha de Ouro* + owner, viewed detail, banned and unbanned (DB-confirmed), changed internal role (DB-confirmed), impersonated the owner and returned via the banner |
| 5 — tenant | `phase5-*.png` — created/edited/deleted a service; created *Rafael* with 2 services and a Monday split shift (`1:09:00-12:00 \| 1:13:00-19:00` in Postgres); overlap rejected with the pt-BR message; edited integration settings (`sheets / 1PlanilhaEditadaPeloPainel / -240` in Postgres); read a transcript; invited and cancelled a team member; saved org settings and watched the sidebar update |
| 6 — 16.3 pass | `phase6-servicos-after-revalidate.png` — all flows re-run; new service visible on `/painel` after a client-side navigation with no reload |

Definition of done:

- `bun x ultracite check apps/dashboard packages/ui packages/env` — exit 0.
  (`packages/ui/src/components/sidebar.tsx` reports 2 pre-existing `info`
  diagnostics; that file is byte-identical to `main`.)
- `turbo typecheck` — clean for `dashboard`, `@workspace/ui`, `@workspace/bookings`.
  `web#typecheck` fails for the pre-existing reason in known issue 3.
- `bun test` — 99 in `apps/dashboard`, 0 failures. Must be run **from
  `apps/dashboard`**: from the repo root bun globs the whole workspace and loads
  no `.env`, so every DB-backed suite fails on env validation (known issue 6).
- `bunx --bun next build` in `apps/dashboard` — succeeds, 18 routes.
- `packages/ui`'s only change is a new file nothing else imports, so `apps/web`'s
  behaviour is unchanged by it (it remains broken for reason 3, as it was before).

---

## 9. Next steps

1. **Delete `NODE_ENV=development` from `apps/web/.env`** and re-run its build —
   that should clear the `/_global-error` failure there too (known issue 1).
2. **Restore the missing landing-page components** in `apps/web` (known issue 3),
   or drop the imports; `apps/web` cannot build until then.
3. **Fix the client-side auth import in `apps/web/lib/auth.ts`** the way
   `apps/dashboard/lib/auth-client.ts` does — import `better-auth/react` instead
   of the `@workspace/auth` barrel (assumption 12).
4. **Cache the drizzle client in `packages/db`** so dev reloads stop leaking
   connections (known issue 2).
5. **Give `packages/ui`'s `SidebarTrigger` an explicit `type="button"`**
   (known issue 4).
6. **Audit log for admin actions** — the biggest real gap now that impersonation
   ships (gap 2). `after()` plus one table.
7. **An appointments view** (gap 1) — decide read-through vs projection.
8. Luiz's styling pass: every screen is composed from unmodified `@workspace/ui`
   primitives with layout utilities only, so restyling should not need structural
   changes.
