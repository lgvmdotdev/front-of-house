import { cn } from "@workspace/ui/lib/utils";

interface WordmarkProps {
	className?: string;
	withDot?: boolean;
}

/**
 * Brand wordmark — "recepcion" in sans + "ai" in mono.
 * The sans→mono shift visualizes the human-to-machine handoff that the
 * product itself makes on every conversation.
 */
export function Wordmark({ className, withDot = true }: WordmarkProps) {
	return (
		<div
			className={cn(
				"inline-flex items-baseline gap-[1px] font-medium text-[19px] text-paper leading-none tracking-[-0.015em]",
				className
			)}
			translate="no"
		>
			<span>recepcion</span>
			<span className="font-medium font-mono text-[0.88em] text-mint tracking-[-0.02em]">
				ai
			</span>
			{withDot ? (
				<span aria-hidden="true" className="ml-[1px] text-mint">
					.
				</span>
			) : null}
		</div>
	);
}
