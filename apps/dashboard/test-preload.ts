import { plugin } from "bun";

/**
 * `import "server-only"` is what stops a `*-queries.ts` module from being pulled
 * into a client bundle: outside a React Server Components graph the package
 * resolves to a file that throws on import. That is exactly what we want from
 * the bundler and exactly what breaks `bun test`, which imports those same query
 * modules directly to run them against Postgres.
 *
 * Next.js resolves the package's `react-server` export condition to an empty
 * module. Bun's global `--conditions=react-server` flag would do the same, but it
 * applies to every package — including `@workspace/env`, which then resolves to
 * its browser entry and fails validation. So neutralise this one specifier and
 * leave the rest of resolution alone.
 */
plugin({
	name: "server-only-noop",
	setup(build) {
		build.module("server-only", () => ({ contents: "", loader: "js" }));
	},
});
