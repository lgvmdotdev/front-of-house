"use client";

import { Button } from "@workspace/ui/components/button";
import { catchError, type ErrorInfo } from "next/error";

/**
 * Section-level error boundary, so one failed read does not take the whole
 * screen down with it. `app/error.tsx` stays as the last resort for the route.
 *
 * Built on `catchError` from `next/error` rather than a hand-rolled React
 * boundary for two reasons: it understands Next's control-flow throws, so
 * `notFound()` and `forbidden()` still reach their own pages instead of being
 * caught here; and `retry()` re-fetches the server data, where a plain
 * `reset()` would replay the same failed render.
 */
function SectionErrorFallback(props: { title?: string }, { retry }: ErrorInfo) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
			<p className="font-medium">{props.title ?? "Algo deu errado"}</p>
			<p className="max-w-sm text-muted-foreground text-sm">
				Não foi possível carregar esta parte da tela.
			</p>
			<Button onClick={() => retry()} size="sm" type="button" variant="outline">
				Tentar novamente
			</Button>
		</div>
	);
}

export const SectionError = catchError(SectionErrorFallback);
