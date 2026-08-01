# Task: build `apps/dashboard` — a new Next.js 16.3 app for Recepcionai

You are running this **unattended**. Do not stop to ask questions. When something is
ambiguous, pick the option with the smallest diff that satisfies the constraints below,
write the assumption into `apps/dashboard/HANDOFF.md` under "Assumptions", and keep going.
Finish every phase. If a phase is genuinely blocked, complete all other phases and record
what you skipped and why.

## 0. Read first (in this order)

- `.claude/CLAUDE.md` — binding conventions (Bun, Ultracite, TDD, no mocking of internal
  code, "read Next.js docs in node_modules before coding"). These override your defaults.
- `.agents/product-marketing.md` — product context and pt-BR voice.
- `packages/db/src/schema/*.ts` — the entity model you're building UI for.
- `packages/auth/src/index.ts` — better-auth config: `admin()`, `organization()`,
  `passkey()`, `lastLoginMethod()` plugins are already wired.
- `packages/ui/` — the shared component library (`components.json` is `radix-nova`-styled;
  exports are `@workspace/ui/components/*`, `@workspace/ui/lib/*`, `@workspace/ui/hooks/*`,
  `@workspace/ui/globals.css`). This is the **only** source of UI primitives.
- `apps/web/` — the patterns to carry over: `lib/session.ts` (`requireSession` /
  `requireActiveOrg`), `app/(dashboard)/dashboard/_actions/catalog.ts` (server actions
  returning `ActionResult`), `lib/catalog*.ts` (query layer + zod input schemas + colocated
  `bun test` files), `middleware.ts` (cookie-presence fast redirect), `next.config.ts`
  (`typedRoutes`, `reactCompiler`, `transpilePackages`, `serverExternalPackages`),
  `components.json` (how an app points shadcn at `packages/ui`).

Then read the Next.js 16.3 material and decide **which features actually earn their place**
— do not adopt a feature just because it's new. Record each adoption/rejection in one line
in `HANDOFF.md`:
- https://nextjs.org/blog/next-16-3-turbopack
- https://nextjs.org/blog/next-16-3-instant-navigations
- https://nextjs.org/blog/next-16-3-ai-improvements
- https://nextjs.org/blog (skim the other 16.x releases)

Reference repos — read for structure, don't clone wholesale:
- https://github.com/vercel/next-app-router-playground — App Router layout/route-group idioms
- https://github.com/vercel/platforms — multi-tenant resolution (reference only, see §2)
- https://github.com/vercel/chatbot and https://github.com/vercel-labs/async-react-demo —
  server-action + form-submission ergonomics, `useActionState`, optimistic UI
- https://github.com/vercel-labs/next-beats — cache components + partial prefetching

You also have the `next-cache-components`, `next-best-practices`, `turborepo`, `shadcn`,
and `better-auth-best-practices` skills, and the `next-devtools` and `shadcn` MCP servers.
Use them instead of guessing APIs.

## 1. Hard constraints

- **New app only.** Create `apps/dashboard`. Do **not** modify `apps/web`,
  `apps/whatsapp-*`, `packages/db` schema, `packages/auth`, or the landing page. If you need
  a change in one of those, stop and note it in `HANDOFF.md` instead. Two carve-outs:
  `packages/env` (add `packages/env/src/dashboard.ts`, mirroring `web.ts`) and `packages/ui`
  (see below).
- **UI comes from `@workspace/ui` — no second shadcn install.** `apps/dashboard` gets a
  `components.json` copied from `apps/web`'s: same `radix-nova` style, same
  `"css": "../../packages/ui/src/styles/globals.css"`, same aliases
  (`"ui": "@workspace/ui/components"`, `"utils": "@workspace/ui/lib/utils"`,
  `"iconLibrary": "remixicon"`). When a screen needs a primitive that doesn't exist yet
  (table, tabs, form, switch, etc.), **add it to `packages/ui/src/components/`** via the
  shadcn CLI/MCP and import it from `@workspace/ui/components/<name>`. Never vendor a copy
  into `apps/dashboard`. Adding new primitives to `packages/ui` is allowed; editing or
  restyling existing ones is not — the landing page depends on them.
  `apps/dashboard/components/` holds only app-specific composed components (managers,
  forms, sidebars), same as `apps/web/components/`.
- **No custom styling or theming.** Compose the existing `@workspace/ui` primitives with
  layout utilities only. No bespoke CSS, no palette work — Luiz styles it later.
- **Next.js 16.3 preview pinned to `apps/dashboard` only.** Do not bump `next` in
  `apps/web`. If the preview version needs a React version that conflicts with the workspace,
  pin it locally in `apps/dashboard/package.json` and note the divergence. Keep
  `transpilePackages: ["@workspace/ui"]` in `next.config.ts`; if the 16.3 preview breaks on
  a `packages/ui` primitive, fix the app-side usage, not the package.
- **Schema is frozen.** No new tables, no new columns. Build UI for what exists. If a screen
  genuinely needs a column that doesn't exist, omit the screen's feature and log it in
  `HANDOFF.md` as "schema gap".
- **DB access:** read/inspect/seed via the TablePro MCP (connection + database
  `next_template`) and via drizzle. Never apply DDL by hand through the MCP — schema changes
  only ever happen through `packages/db` migrations, and you aren't making any.
- **Dependencies:** Next, React, `@workspace/*`, `zod` (catalog), `sonner`. Anything else
  needs a one-line justification in `HANDOFF.md`.
- **Language:** all tenant-facing UI strings in **pt-BR** (match existing route names:
  `/servicos`, `/profissionais`). The `/admin` panel may be pt-BR too — keep it consistent.
- **Dev port:** `3001` (`apps/web` owns 3000). Add `dev`/`build`/`start`/`lint`/`format`/
  `typecheck` scripts mirroring `apps/web/package.json`.

## 2. Architecture decisions (already made — implement these, don't relitigate)

- **One app, two route groups:** `app/(admin)/admin/*` and `app/(app)/*` (tenant dashboard).
  Not two apps.
- **Tenant resolution: path/session-based, not subdomains.** Tenancy comes from
  better-auth's `session.activeOrganizationId`, exactly as `apps/web/lib/session.ts` does.
  Read `vercel/platforms` for ideas, but do not introduce subdomain routing.
- **Admin gating:** better-auth `admin()` plugin — `user.role === "admin"`. Enforce in the
  `(admin)` layout server-side; middleware does the cheap cookie check only.
- **Every DB query is org-scoped.** No query in `(app)` may run without an
  `organizationId` filter derived from the session. Treat a missing filter as a bug.
- **Mutations are server actions** returning a discriminated `ActionResult`, validated with
  zod at the boundary, followed by `revalidatePath`/`revalidateTag`. Mirror
  `apps/web/app/(dashboard)/dashboard/_actions/catalog.ts`.
- **Known snag:** `organization()` is configured with `organizationLimit: 1`. Admin-created
  tenants must be created server-side against the *owner* user. If the limit blocks you,
  create the org for a fresh owner user rather than changing the auth config.

## 3. Entities to cover

Tenant dashboard (`(app)`), all scoped to the active organization:
- `service` — name, duration, price (cents), active
- `professional` — name, `calendarId`, active
- `professional_service` — which services each professional performs (m2m)
- `working_hours` — weekly windows per professional, split shifts allowed, weekday 0–6, "HH:MM"
- `integration_settings` — provider, `spreadsheetId`, `offsetMinutes` (one row per org)
- `whatsapp_channel` — `phoneNumberId` → org mapping (read-only view is fine)
- `conversation` + `conversation_message` — thread list and transcript, read-only,
  filter by status (`open` | `handed_off` | `closed`)
- `member` / `invitation` — team screen: list members, invite, change role, revoke
- organization settings — name, slug, logo

Admin panel (`(admin)`), cross-tenant:
- tenants (organizations) list + detail (members, catalog counts, WhatsApp channel,
  integration settings, recent conversations)
- users list — ban/unban, role, impersonate (better-auth admin plugin supports all three;
  `session.impersonatedBy` already exists in the schema)
- create a tenant (org + owner user)

## 4. Phases — verify at each gate before moving on

1. **Scaffold.** `apps/dashboard` with Next 16.3 preview, Tailwind v4 via
   `@workspace/ui/globals.css`, `components.json` pointed at `packages/ui`,
   `packages/env/src/dashboard.ts`, turbo wiring, `.env` (copy `apps/web/.env` shape:
   `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `PROJECT_NAME`, `NODE_ENV`).
   **Gate:** `bun run dev` serves a page on :3001 rendering a `@workspace/ui` `Button`
   with correct styles; `bun run typecheck` clean.
2. **Auth + shell.** Login, `/api/auth/[...all]`, `lib/session.ts` (session,
   `requireActiveOrg`, `requireAdmin`), middleware, sidebar shell for both route groups
   (reuse `@workspace/ui/components/sidebar`).
   **Gate:** signed-out → `/login`; non-admin hitting `/admin` → 403/redirect. Verify in d3k.
3. **Seed fixtures.** A committed, idempotent `bun run seed` script under
   `apps/dashboard/scripts/` that creates:
   - admin user `admin@recepcionai.test` / `Admin123!` with `role = "admin"`
   - demo tenant `Barbearia Demo` (slug `barbearia-demo`), owner
     `dono@barbearia-demo.test` / `Dono123!`
   - 3 services, 2 professionals with working hours and service links,
     `integration_settings`, one `whatsapp_channel`, 2 conversations with messages
   **Gate:** run it twice — second run must not duplicate rows. Confirm via TablePro MCP.
4. **Admin panel.** All screens from §3.
   **Gate:** d3k walkthrough — log in as admin, create a second tenant, view it, ban and
   unban a user.
5. **Tenant dashboard.** All entities from §3.
   **Gate:** d3k walkthrough — log in as the demo owner, create/edit/delete a service,
   create a professional with two services and a split shift, edit integration settings,
   read a conversation transcript. Confirm the writes landed via TablePro MCP.
6. **16.3 features pass.** Now that flows work, apply the instant-navigation / cache-
   components / prefetching techniques where they measurably help, and record what you
   adopted and rejected.
   **Gate:** flows still pass in d3k; no stale-data bug after a mutation.

## 5. Testing

Follow the repo's TDD rules — tests before code, `bun test` with `bun:test`, no mocking of
internal code, real Postgres from `packages/db/docker-compose.yml` with transaction rollback
for isolation. At minimum, colocated tests for: zod input schemas, every org-scoped query
function (including a test proving cross-tenant reads return nothing), and working-hours
overlap/validation logic. UI components don't need tests; the d3k walkthroughs cover them.

## 6. Running the app

Use the `d3k` skill for every UI verification — start it non-interactively, wait for
readiness, drive the flows listed in the gates, and read both browser and server output.
Screenshot each gate's happy path into `apps/dashboard/.verification/`.

## 7. Definition of done

All of these pass from the repo root:
- `bun x ultracite check` clean for `apps/dashboard` and `packages/ui`
- `bun run typecheck` clean
- `bun test` green
- `bunx --bun next build` succeeds in `apps/dashboard`
  (note: `apps/web`'s build has a pre-existing `/_global-error` failure — that one is not
  yours, don't chase it)
- `apps/web` still builds and renders unchanged after any `packages/ui` addition
- every §4 gate walkthrough completed in d3k with a screenshot
- `apps/dashboard/HANDOFF.md` written: what was built, primitives added to `packages/ui`,
  16.3 features adopted/rejected and why, assumptions taken, schema gaps found, seeded
  credentials, known issues, next steps

## 8. Git

Work on a branch `feat/dashboard-app`. Commit per phase with a clear message. Do not push,
do not open a PR. Leave the working tree clean.
