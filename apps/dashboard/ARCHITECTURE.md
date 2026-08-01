# apps/dashboard — target architecture

Patterns extracted from two reference apps by Aurora Scharff (Next.js 16.3-preview.10,
same version we pin), and what to change here.

| Repo | Shows |
|---|---|
| [next16-social-media](https://github.com/aurorascharff/next16-social-media) | The full architecture: feature folders, synchronous pages, Cache Components with per-user tags, `useOptimistic`, `catchError` boundaries |
| [next16-team-chat](https://github.com/aurorascharff/next16-team-chat) | The same, plus the *cache contract* pattern when server tags and a client cache (TanStack Query) describe the same data |

Both vendor the author's own `nextjs-app-architecture` skill. **We already have it** at
`.claude/skills/nextjs-app-architecture/` (v1.3.7, untracked — commit it). That skill is
the machine-readable form of Parts 1–2 below; this file is the part it can't know: how it
maps onto *our* code.

---

## Part 1 — The ten invariants

Verbatim from the skill, with the file in the reference app that demonstrates each.

1. **Pages compose, never fetch.** A page imports feature components and places
   `<Suspense>`. No queries, no domain logic, no route-specific components inline.
   → `app/page.tsx` (social) is 47 lines, zero queries.
2. **Pages stay synchronous.** `params.then()` / `searchParams.then()`, never
   `await params` at the top. Chrome paints into the static shell; only data-dependent
   sections suspend. → `app/u/[handle]/page.tsx`.
3. **Feature components receive IDs, not route props.** The page resolves `params` and
   passes `id` / `handle` / a parsed filter. → `<ProfileFeed handle={handle} tab={...} />`.
4. **Async server component is the default.** `'use client'` only for hooks, event
   handlers, browser APIs — and only on **leaves**.
5. **The page owns the `<Suspense>`; the feature owns the skeleton.** Features never
   pre-wrap themselves.
6. **Skeletons live in the same file as the component**, exported alongside it, defined
   *last*. `Drop` + `DropListSkeleton` are siblings in `drop.tsx`.
7. **`<domain>-queries.ts`** starts with `import 'server-only'`; **`<domain>-actions.ts`**
   starts with `'use server'`. Filename matches the folder.
8. **One feature folder per real domain noun.** Sub-concepts (like, bookmark, search,
   favorite) fold into the parent — `toggleBookmark` lives in `drop-actions.ts`.
9. **Client components import actions directly** — never receive an action as a prop
   just to call it. ✅ *we already do this.*
10. **Feature-local cache coordination stays with its domain** — pure tags/keys in
    `<domain>-cache.ts`, client query defs in `<domain>-query-options.ts`, hooks in
    `hooks/use-*.ts`.

Folder shape:

```
app/                    # pages + layouts, composition only
features/<domain>/
  <domain>-queries.ts   # import 'server-only'
  <domain>-actions.ts   # 'use server'
  <domain>-schema.ts    # zod (our naming; the skill allows any <domain>-*.ts)
  components/           # server owners + client leaves, each with its skeleton
  types/ hooks/         # only when a second file needs them
components/ui/          # primitives
lib/                    # db.ts, utils.ts — no domain logic
```

---

## Part 2 — Pattern catalogue

### 2.1 The synchronous page

```tsx
export default function ProfilePage({ params, searchParams }: PageProps<'/u/[handle]'>) {
  return (
    <div className="group/tabs">
      <PageHeader back title="Profile" />                     {/* static shell */}
      <Suspense fallback={<ProfileHeaderSkeleton />}>
        <Crossfade>{params.then(({ handle }) => <ProfileHeader handle={handle} />)}</Crossfade>
      </Suspense>
      <div className="transition-opacity group-has-data-pending/tabs:opacity-50">
        <Suspense fallback={<DropListSkeleton />}>
          {Promise.all([params, searchParams]).then(([{ handle }, sp]) => (
            <ProfileFeed handle={handle} tab={parseTab(sp.tab)} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}
```

Three things to notice:

- `parseTab` / `parsePage` are **module-level functions in the page file** — parsing
  `searchParams` is the page's job, so features get typed values, not `string | string[]`.
- `Promise.all([params, searchParams]).then(...)` is the two-promise form.
- `generateMetadata` *does* `await params`. That's fine — it's a separate function, it
  doesn't make the page body dynamic.

### 2.2 Suspense placement rules (the CLS-prevention set)

1. Fixed-height section → its own boundary is safe.
2. Variable-height section → **group everything below it into the same boundary**, or the
   lower sections paint in the wrong place and jump.
3. Headings stay *outside* boundaries when their final position is stable.
4. Variable-length lists → 2–5 skeleton items, not the real count.
5. Never `fallback={null}` for visible UI.
6. Never wrap the whole page. Chrome paints instantly, always.
7. Inner Suspense content stays out of the outer skeleton — each boundary owns its own.

### 2.3 Skeleton as a sibling export

```tsx
// features/drop/components/drop.tsx
export async function Drop({ drop }: Props) { ... }
export function DropList({ drops }: { drops: Drop[] }) { ... }
function DropSkeleton() { ... }                          // not exported: internal
export function DropListSkeleton({ count = 5 }) { ... }  // last in file
```

No alias skeletons. A variant passes props inline at the boundary:
`fallback={<DropListSkeleton count={3} />}`.

### 2.4 Server owner + client leaf

`drop.tsx` is an async server component that awaits its own reads and renders a
`'use client'` leaf for the interactive strip:

```tsx
export async function Drop({ drop }: Props) {
  const interactions = await getUserDropInteractions();
  return (
    <article>
      <DropBody body={drop.body} />
      <DropActions dropId={drop.id} likes={drop.likes} userState={...} />  {/* leaf */}
    </article>
  );
}
```

And composition crosses the boundary in the other direction — a client form takes
server-rendered JSX as a prop:

```tsx
<ReplyComposerForm
  dropId={id}
  avatar={<Suspense fallback={<UserAvatarSkeleton />}><CurrentUserAvatar /></Suspense>}
/>
```

### 2.5 Queries: the tenant-key wrapper

This is the pattern that matters most for us. Every read is per-user, and cookies can't be
read inside `'use cache'` — so the **exported wrapper** resolves the request-scoped value
and passes it as an argument to a private cached function:

```ts
import 'server-only';

export async function getFeed(page = 1) {
  return getFeedForHandle(await getCurrentUserHandle(), page);   // exported: dynamic
}

async function getFeedForHandle(handle: string, page: number) {  // private: cached
  'use cache';
  cacheTag('feed', `feed:${handle}`);
  ...
}
```

Session reads themselves use `'use cache: private'` (browser-only, never stored
server-side):

```ts
export async function getCurrentUserHandle(): Promise<string> {
  'use cache: private';
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? DEFAULT_HANDLE;
}
```

Tag vocabulary is two tags per read: a **global** one (`'feed'`, `'drops'`, `'users'`) and
a **scoped** one (`` `feed:${handle}` ``, `` `drop-${id}` ``). Plus `cacheLife('hours')`
where staleness is acceptable.

Queries also **map ORM rows to domain types** (`toDrop(row)`) so components never see a
Prisma/Drizzle row, and call `notFound()` themselves when the row is missing.

### 2.6 Actions: verify → validate → mutate → invalidate → return

```ts
'use server';

export async function postDrop(formData: FormData) {
  const validated = validateBody(formData.get('body'));       // zod
  if (!validated.ok) return { error: validated.error, ok: false as const };
  const me = await verifyAuth();                              // re-check auth
  const drop = await prisma.drop.create({ ... });
  updateTag('feed');                                          // matching tags
  updateTag(`user-drops-${me}`);
  return { drop, ok: true as const };
}
```

- `updateTag(tag)` in **server actions** (read-your-own-writes).
- `revalidateTag(tag, 'max')` in **route handlers** (webhooks, cron). Single-arg form is
  deprecated.
- `refresh()` only for reads deliberately left dynamic — *not* a substitute for tags.
- Discriminated union return, never a throw at the client boundary. ✅ *matches our
  `ActionResult`.*
- Cross-user side effects invalidate the *other* user's tag:
  `revalidateTag(`notifications:${parent.authorHandle}`, 'max')`.

### 2.7 Feedback: optimistic first, toast only on error

| Situation | Tool |
|---|---|
| Toggle unlikely to fail (like, follow, active/inactive) | `useOptimistic` inside `startTransition` |
| Filters / tabs / navigation | `useTransition` + `data-pending` attribute |
| Field-level validation | `useActionState`, render inline with `role="alert"` |
| Submit spinner | `useFormStatus` from a *child* of `<form>` |

The `data-pending` trick avoids prop-drilling entirely — the pending node sets the
attribute, ancestors react in CSS:

```tsx
<nav data-pending={isPending ? '' : undefined}>…</nav>
// ancestor, in the page:
<div className="transition-opacity group-has-data-pending/tabs:opacity-50">
```

Toast rules: **error only** when an optimistic UI already shows the result. Success toast
only for invisible side effects (invite sent, link copied). Never toast inside a server
action. Never toast routine navigation.

Destructive actions: confirm in a dialog, **don't `redirect()` inside the action** (it
throws, so the dialog never closes), and **don't wrap the action call in
`useTransition`** — with view transitions on it animates the background behind the dialog.
Track pending with `useState`/`useOptimistic(false)` and reserve `startTransition` for the
navigation after success.

### 2.8 Error boundaries built on `catchError`

```tsx
'use client';
import { catchError, type ErrorInfo } from 'next/error';

function ErrorFallback(props: { title?: string; compact?: boolean }, { retry }: ErrorInfo) {
  return <div>…<Button onClick={() => retry()}>Try again</Button></div>;
}
export default catchError(ErrorFallback);
```

Then per fallible section, **in the page**:

```tsx
<ErrorBoundary title="Replies didn’t load">
  <Suspense fallback={<RepliesSkeleton />}><Replies id={id} /></Suspense>
</ErrorBoundary>
```

Why not `react-error-boundary`: it swallows Next's control-flow throws, so `notFound()` /
`forbidden()` never reach their pages, and its reset doesn't re-fetch server data.

### 2.9 The cache contract (team-chat only)

When a server tag and a client query key name the same data, one pure file owns both
identities so a spelling can't drift between the read and its invalidation:

```ts
// features/channel/channel-cache.ts — imports neither Next nor TanStack
export const channelKeys = { unread: ['channels', 'unread'] as const, ... }
export const channelTags = { unread: 'channels:unread', detail: (id: string) => `channel:${id}`, ... }
```

The async server component owns the initial read **and** the hydration provider; the page
stays a composition surface:

```tsx
export async function ChannelList() {
  const unread = await getUnreadChannels();
  return (
    <HydrationBoundary state={await dehydrate([{ queryKey: channelKeys.unread, data: unread }],
                                              { tags: [channelTags.unread] })}>
      <ChannelNav groups={...} />
    </HydrationBoundary>
  );
}
```

Server `cacheLife` and client `staleTime` stay **independent** — coordinate identities and
invalidation, never durations.

### 2.10 Small reusable primitives worth stealing

| File | ~Lines | What it does |
|---|---|---|
| `components/ui/crossfade.tsx` | 8 | `<ViewTransition enter="auto" default="none">` — crossfades content on Suspense reveal only |
| `components/ui/error-boundary.tsx` | 31 | `catchError` fallback with `compact` variant |
| `components/ui/refresh-button.tsx` | 27 | `router.refresh()` in a transition, spinner while pending |
| `components/ui/nav-link.tsx` | 87 | `<Link>` + `aria-current` + `useLinkStatus` pending state, render-prop `className`/`children`, wrapped in its own `<Suspense>` so `usePathname` is safe under `cacheComponents` |
| `components/ui/tabs.tsx` | 80 | Link-based tabs with `useOptimistic` active state + `data-pending` |
| `components/ui/load-more.tsx` | 28 | `router.push(href, { scroll: false })` in a transition |

---

## Part 3 — What was applied

All five patterns are in. `lib/` no longer holds domain logic; `app/` no longer
holds queries, actions or route-shaped components.

### File map

```
app/                                  synchronous composition surfaces only
  (app)/{painel,servicos,profissionais,conversas,conversas/[id],
         integracao,configuracoes,whatsapp,equipe}/page.tsx
  (admin)/admin/{,barbearias,barbearias/[id],usuarios}/page.tsx
features/
  catalog/      catalog-{queries,actions,schema}.ts  working-hours.ts
                components/ services-table · service-controls
                            professionals-table · professional-controls
                            catalog-summary-cards
  conversation/ conversation-{queries,status}.ts
                components/ conversations-table · conversation-filters
                            conversation-transcript · conversations-summary-card
                            status-badge
  organization/ organization-{queries,actions,schema}.ts
                components/ integration-{card,form} · organization-{card,form}
                            whatsapp-channels
  team/         team-{queries,actions,schema}.ts
                components/ team-members · pending-invitations
                            invite-form · team-controls
  tenant/       tenant-{queries,actions,schema}.ts        (admin, cross-tenant)
                components/ platform-stats · recent-tenants · tenants-table
                            tenant-detail · create-tenant-dialog
  user/         user-{queries,actions}.ts                 (admin, cross-tenant)
                components/ users-table · user-controls
components/ui/  section-error.tsx  table-skeleton.tsx  (+ confirm-button, empty-state)
lib/            action-result · auth-client · format · session · use-action · test-org
```

Six domains, not nine: services + professionals + working hours are all
**catalog**; the shop profile, the booking integration and the WhatsApp channel
are all **organization**. `whatsapp` never became a folder — one query and one
read-only screen is exactly what the merge rule says to fold in.

### Pattern by pattern

**1. Synchronous pages.** All 13 pages are now `export default function`, zero
`await` in a page body, zero query imports. The two parameterised routes use
`params.then()`. `/conversas` parses `?status=` with a module-level
`parseConversationStatus` and hands the feature a typed value.

**2. Feature folders.** Reads and write helpers in `<domain>-queries.ts` with
`import 'server-only'`; `'use server'` orchestration in `<domain>-actions.ts`;
zod in `<domain>-schema.ts`, which stays client-importable. Tests moved next to
their subjects and split along the same seams — `lib/tenant.test.ts` became
three files.

**3. Server owner + client leaf.** Every table is an async server component that
awaits its own read. What ships to the browser is only the dialogs, the row
buttons and the selects. Each row owns its own dialog instance instead of the
table hoisting a shared `editing` record — its initial state is just props,
which is what let the table become a server component at all.

**4. Suspense + skeletons.** 18 boundaries across 13 pages, each with a real
shaped fallback and none of them `null` over visible UI. Skeletons are sibling
exports at the end of the component's own file. `TableSkeleton` /
`CardGridSkeleton` / `ListSkeleton` are the three shapes every screen reuses.
Both route-level `loading.tsx` files are **gone**: they existed to hide a
blocking page, and a generic full-area blank now pre-empts the real shell it was
working around.

**5. Feedback.** `useOptimistic` on the two role selects, unban, and the
conversation filter. `router.refresh()` dropped from `useAction` — every action
already `revalidatePath`s the screens it affects, and a server action that
revalidated the current route returns the fresh payload with its own response,
so the refresh was a second round-trip for data we had. `useAction` now takes
`successMessage: null` where an optimistic update already shows the result.

### Also changed, because the refactor required it

- **`section-error.tsx`** — `catchError` from `next/error`, one boundary per
  fallible section. Verified it does *not* swallow framework throws:
  `/admin/barbearias/<id>` as a non-admin still returns a real **403**.
- **`cache()` on the session helpers.** Pages became composition surfaces, so a
  single render now calls `requireActiveOrg()` from the layout *and* from every
  feature component that owns a read. Without request-level dedup that is one
  session lookup per section. Same for `listServices`, `listTenants`,
  `getPlatformTotals`, `getConversation` and `getTenantDetail`, each of which is
  read by two or more components in one render.
- **`server-only` dependency + `bunfig.toml` test preload.** The package is what
  makes invariant 7 enforceable, but outside an RSC graph it throws on import —
  including under `bun test`, which imports the query modules directly to run
  them against Postgres. Bun's global `--conditions=react-server` fixes that and
  breaks `@workspace/env`, so `test-preload.ts` neutralises this one specifier
  and leaves resolution alone.

### Two intentional exceptions to invariant 1

Don't "fix" these in a later audit:

- **`app/page.tsx` stays async.** It renders nothing — it awaits the session and
  redirects by role. There is no chrome to paint early.
- **The two `[id]` pages import from `*-queries`.** Only inside
  `generateMetadata`, which runs before render and is a separate function, so it
  does not make the page body dynamic. The reference app does exactly this
  (`app/drop/[id]/page.tsx` imports `getDrop`). No page *body* imports a query.

### One trade-off worth knowing

A missing or foreign id on `/conversas/[id]` and `/admin/barbearias/[id]` now
renders the 404 **page** but returns a 200 **status**. A synchronous page commits
its response before the boundary resolves, so a later `notFound()` can swap the
UI but not the status line — `generateMetadata` doesn't help, because metadata
streams too. Verified, deliberate, and reversible per-route by awaiting the read
in the page body. For an authenticated panel with no crawlers, the rendered page
is what matters; if it ever does matter, those two pages go back to async.

### Verification

- `tsc --noEmit` clean; `ultracite check` clean (100 files); `next build` green,
  18 routes; `bun test` **99 pass / 0 fail** in 12 files.
- All 13 screens fetched with a real signed-in session and asserted on their
  rendered pt-BR content — owner cookie for `(app)`, admin cookie for `(admin)`.
- Browser-driven over CDP: create a service → row appears with no reload → the
  overview count follows → delete asks for confirmation → row disappears. Plus
  the optimistic filter: the highlight moves while the URL is still unchanged,
  and `data-pending` is observed on the clicked link during the navigation. No
  console errors.
- Not exercised in a browser: the two role selects and unban. They reuse the
  hook pattern the filter test covers, and driving them would have mutated the
  seeded owner's permissions.

---

## Part 4 — What NOT to copy

- **`components/internal/boundary.tsx`** — a localStorage-toggled render-highlight
  devtool wrapped around *every* client component in the social app. Debug scaffolding.
- **`features/demo/`, `demo-toolbar`, `slow-mode`, `delay(ms, slow)` calls inside
  queries, `bot-driver`** — instrumentation so the author can demo streaming on stage.
- **TanStack Query / SWR** — team-chat needs them for live unread counts. We have one
  screen (`/conversas`) that might ever want polling, and the pattern is available if it
  does. Don't add a client cache before the product asks.
- **Prisma, `generated/prisma/`** — we're on Drizzle.
- **`Paginator` / `DiscoverFeed` dual pagination** — two implementations to teach a
  tradeoff. Our lists are per-barbershop and small.
- **View transitions everywhere** — `Crossfade` is 8 lines and worth it; the rest of the
  `react-view-transitions` skill is not our problem yet.
- **`app/api/*` route handlers for polling** — only exist to feed the client caches.

---

## Part 5 — The `cacheComponents` question

`HANDOFF.md` §3 rejected `cacheComponents` on the grounds that every read is keyed by
`organizationId`, which comes from `cookies()`/`headers()` — which a `'use cache'` scope
may not read. **That constraint is real, and it is exactly what both reference apps hit
and solve** (§2.5): the exported wrapper stays dynamic and reads the session, then calls a
private `'use cache'` function with the tenant id as its first argument. `getFeed()` /
`getFeedForHandle(handle, …)` is `listServices()` / `listServicesForOrg(organizationId, …)`.
Session lookups use `'use cache: private'`.

So the cost isn't architectural, it's mechanical: one wrapper per query plus a per-tenant
tag vocabulary (`` `services:${organizationId}` ``) — which our actions effectively already
maintain as `revalidatePath` path lists.

The other half of the rejection still stands on its own, though: caching 3 ms org-scoped
queries in a write-heavy panel buys nothing. **The reason to revisit is not query cost —
it's the static shell.** `cacheComponents` is what makes `partialPrefetching`,
`export const instant`, and cached navigations legal, and those are the difference between
"sidebar paints, content blanks, table appears" and a genuinely instant panel.

Recommendation: **defer, don't reject.** Phases 1–4 are the ones that make navigation feel
fast, and none of them need the flag — a synchronous page with per-section Suspense is a
win with or without a static shell. Revisit after Phase 3, when every page is already
shaped correctly and turning the flag on is a config change plus a tag pass rather than a
rewrite. `HANDOFF.md` §3 now says "deferred, wrapper pattern is the path" so the next
session doesn't re-litigate it from the old premise.
