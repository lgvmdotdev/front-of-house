import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";
import { getPlatformTotals } from "../tenant-queries";

/** The three counters at the top of `/admin`. */
export async function PlatformStats() {
	const totals = await getPlatformTotals();

	const stats = [
		{ label: "Barbearias", value: totals.tenants, href: "/admin/barbearias" },
		{ label: "Usuários", value: totals.users, href: "/admin/usuarios" },
		{
			label: "Conversas",
			value: totals.conversations,
			href: "/admin/barbearias",
		},
	] as const;

	return (
		<>
			{stats.map((stat) => (
				<Link href={stat.href} key={stat.label}>
					<Card className="h-full transition-colors hover:border-ring">
						<CardHeader>
							<CardDescription>{stat.label}</CardDescription>
							<CardTitle className="text-3xl">{stat.value}</CardTitle>
						</CardHeader>
					</Card>
				</Link>
			))}
		</>
	);
}

export function PlatformStatsSkeleton() {
	return <CardGridSkeleton cards={3} />;
}
