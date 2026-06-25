import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import { SectionLabel } from "./section-label";

interface SectionProps {
	bordered?: boolean;
	children: ReactNode;
	className?: string;
	headerClassName?: string;
	heading?: ReactNode;
	id?: string;
	kicker?: string;
	lede?: ReactNode;
	number?: string;
}

export function Section({
	id,
	number,
	kicker,
	heading,
	lede,
	children,
	className,
	headerClassName,
	bordered = true,
}: SectionProps) {
	const hasHeader = Boolean(number || kicker || heading || lede);

	return (
		<section
			className={cn(
				"relative",
				bordered && "border-line/70 border-t",
				className
			)}
			id={id}
		>
			<div className="container mx-auto max-w-6xl px-6 py-24 md:py-32 lg:px-10">
				{hasHeader ? (
					<header
						className={cn(
							"mb-14 flex max-w-3xl flex-col gap-6 md:mb-20",
							headerClassName
						)}
					>
						{number && kicker ? (
							<SectionLabel kicker={kicker} number={number} />
						) : null}
						{heading ? (
							<h2 className="text-balance font-heading font-medium text-[2.25rem] text-paper leading-[1.04] tracking-[-0.03em] md:text-[2.85rem] lg:text-[3.4rem]">
								{heading}
							</h2>
						) : null}
						{lede ? (
							<p className="max-w-2xl text-base text-paper-muted leading-relaxed md:text-lg">
								{lede}
							</p>
						) : null}
					</header>
				) : null}
				{children}
			</div>
		</section>
	);
}
