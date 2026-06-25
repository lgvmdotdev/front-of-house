import { cn } from "@workspace/ui/lib/utils";

interface SectionLabelProps {
	className?: string;
	kicker: string;
	number: string;
}

export function SectionLabel({ number, kicker, className }: SectionLabelProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.22em]",
				className
			)}
		>
			<span className="text-mint">{number}</span>
			<span aria-hidden="true" className="h-px w-8 bg-line-strong" />
			<span className="text-paper-muted">{kicker}</span>
		</div>
	);
}
