# Project Conventions

Guidance for anyone (human or agent) writing code in this repo.

## Contents

1. [Product](#product) — what we're building and for whom
2. [Runtime & Tooling](#runtime--tooling) — Bun, Ultracite
3. [Framework Notes](#framework-notes) — Next.js, Effect-TS
4. [Code Standards](#code-standards) — principles, style, security, performance
5. [Testing](#testing) — TDD, no mocking, hygiene

---

## Product

**Recepcionai** (recepcion-AI) is an AI receptionist for barbershops that operates on WhatsApp. The agent reads incoming customer messages, books appointments into the barbershop's existing scheduling tool (Booksy, Trinks, Belezito, Google Agenda, etc.), answers questions about services and barber availability, and sends day-of confirmations to reduce no-shows.

- **Market:** Brazilian barbershops. Customer communication is pt-BR; WhatsApp is the channel.
- **Stage:** Private beta with a few pilot shops. No public testimonials or no-show-reduction numbers yet — **do not fabricate any**.
- **Positioning:** Not a replacement for existing booking tools — a layer on top. We integrate, we don't compete.
- **Primary conversion action on the marketing site:** "Agendar demonstração" (book a demo with the founder). No self-serve trial. **Pricing is never shown publicly.**
- **Founder:** Luiz Vergennes, senior software engineer.

Full product-marketing context — positioning, voice-of-customer, capability list, FAQ guidance, copy do/don't list, brand — lives in [.agents/product-marketing.md](../.agents/product-marketing.md). Read it before writing any marketing copy, landing-page sections, or customer-facing UI strings.

---

## Runtime & Tooling

### Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`.
- Use `bun test` instead of `jest` or `vitest`.
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`.
- Use `bun install` instead of `npm install`, `yarn install`, or `pnpm install`.
- Use `bun run <script>` instead of `npm run <script>`, `yarn run <script>`, or `pnpm run <script>`.
- Use `bunx <package> <command>` instead of `npx <package> <command>`.
- Bun automatically loads `.env`, so don't use `dotenv`.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

### Ultracite (lint & format)

This project uses **Ultracite**, a zero-config preset powered by Biome. Most issues are automatically fixable.

| Task                | Command                |
| ------------------- | ---------------------- |
| Format code         | `bun x ultracite fix`  |
| Check for issues    | `bun x ultracite check`|
| Diagnose setup      | `bun x ultracite doctor`|

Run `bun x ultracite fix` before committing.

#### When Biome can't help

Biome catches syntax and style. Focus your own attention on:

1. **Business logic correctness** — Biome can't validate algorithms.
2. **Meaningful naming** — descriptive names for functions, variables, and types.
3. **Architecture decisions** — component structure, data flow, API design.
4. **Edge cases** — boundary conditions and error states.
5. **User experience** — accessibility, performance, usability.
6. **Documentation** — comments for complex logic; prefer self-documenting code.

---

## Framework Notes

### Effect-TS: always refer to the Entire Effect-TS repository cloned under `.effect-ts/effect`.

Before any Effect-TS work, find and read the repository in `.effect-ts/effect`. Your training data is outdated — the docs are the source of truth.

### Next.js: always read docs before coding

Before any Next.js work, find and read the relevant doc in `apps/web/node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

### Next.js conventions

- Use the `<Image>` component for images, not `<img>`.
- Use `next/head` or the App Router metadata API for head elements.
- Use Server Components for async data fetching instead of async Client Components.

### React 19+

- Use `ref` as a prop instead of `React.forwardRef`.

---

## Code Standards

Write code that is **accessible, performant, type-safe, and maintainable**. Prefer clarity and explicit intent over brevity.

### Type safety & explicitness

- Use explicit types for function parameters and return values when they enhance clarity.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- Use const assertions (`as const`) for immutable values and literal types.
- Lean on TypeScript's type narrowing instead of type assertions.
- Replace magic numbers with named constants.

### Modern JavaScript & TypeScript

- Use arrow functions for callbacks and short functions.
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops.
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access.
- Prefer template literals over string concatenation.
- Use destructuring for object and array assignments.
- `const` by default, `let` only when reassignment is needed, never `var`.

### Async & promises

- Always `await` promises in async functions — don't drop the return value.
- Use `async/await` over promise chains.
- Handle errors meaningfully with `try/catch`.
- Don't use async functions as Promise executors.

### React & JSX

- Use function components, not class components.
- Call hooks at the top level only, never conditionally.
- Specify all dependencies correctly in hook dependency arrays.
- Use the `key` prop for elements in iterables — prefer unique IDs over array indices.
- Nest children between opening and closing tags instead of passing them as props.
- Don't define components inside other components.
- Use semantic HTML and ARIA attributes:
  - Provide meaningful `alt` text for images.
  - Use a proper heading hierarchy.
  - Label form inputs.
  - Include keyboard handlers alongside mouse handlers.
  - Use semantic elements (`<button>`, `<nav>`, …) instead of divs with roles.

### Error handling & debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code.
- Throw `Error` objects with descriptive messages — never strings or other values.
- Use `try/catch` meaningfully; don't catch just to rethrow.
- Prefer early returns over nested conditionals for error cases.

### Code organization

- Keep functions focused and under reasonable cognitive complexity.
- Extract complex conditions into well-named boolean variables.
- Use early returns to reduce nesting.
- Prefer simple conditionals over nested ternaries.
- Group related code; separate unrelated concerns.

### Security

- Add `rel="noopener"` when using `target="_blank"` on links.
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary.
- Don't use `eval()` or assign directly to `document.cookie`.
- Validate and sanitize user input.

### Performance

- Avoid spread syntax in accumulators inside loops.
- Use top-level regex literals instead of creating them inside loops.
- Prefer specific imports over namespace imports.
- Avoid barrel files (index files that re-export everything).
- Use proper image components (e.g. Next.js `<Image>`) over `<img>`.

---

## Testing

This project follows **test-driven development (TDD)**. Write the test before the code.

### The TDD cycle

1. **Red** — Write a small, failing test that describes one piece of desired behavior. Run it and watch it fail for the *right* reason (not a typo, not a missing import).
2. **Green** — Write the minimum code needed to make the test pass. Resist adding anything the test doesn't require.
3. **Refactor** — Clean up the code and the test with the safety net of a passing suite. Keep changes small and reversible.

Tests are the specification. A behavior not covered by a test is not guaranteed to work. Bug fixes start with a regression test that fails *because of the bug* — then the fix makes it pass.

### No mocking of internal code

Mocks drift from the real implementations they impersonate. Tests stay green while production breaks. This project avoids mocking as a default.

- **Internal collaborators** — call the real function, instantiate the real class. If a unit is hard to test without mocking its dependencies, that's a design signal: split the unit or inject simpler seams instead of reaching for a mock.
- **Database** — use the real PostgreSQL instance from `packages/db/docker-compose.yml` for any DB-backed test. Isolate tests with transactions that roll back at the end, or a schema-per-test strategy. Do **not** mock Drizzle or the underlying pg client.
- **HTTP between our own code** — call the real handler/route directly, or spin up the same Next.js route handler used in production. Do **not** mock `fetch` for endpoints we own.
- **True external boundaries only** — third-party APIs we don't control, the system clock, randomness, the filesystem when IO is not the subject of the test — may use a minimal test double. Prefer a hand-written fake that exercises the same contract over an ad-hoc mock library, and inject the dependency so the fake slots in without monkey-patching.

If you feel you *must* mock internal code, stop and reconsider the design first.

### Runner & example

Use `bun test` with `bun:test`:

```ts
// index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

### Test hygiene

- Write assertions inside `it()` or `test()` blocks.
- Use `async/await` in async tests — no done callbacks.
- Never commit `.only` or `.skip`.
- Keep suites reasonably flat — avoid excessive `describe` nesting.
- Prefer one behavior per test; name the test after the behavior, not the function under test.
