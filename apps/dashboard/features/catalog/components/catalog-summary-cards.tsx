import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";
import { requireActiveOrg } from "@/lib/session";
import { countCatalog } from "../catalog-queries";

/** The two catalog cards on the overview. Counted in SQL, not by listing rows. */
export async function CatalogSummaryCards() {
	const { organizationId } = await requireActiveOrg();
	const catalog = await countCatalog(organizationId);

	const cards = [
		{
			href: "/servicos" as const,
			title: "Serviços",
			description: `${catalog.services} cadastrado(s) — duração e preço do que a recepcionista pode agendar.`,
		},
		{
			href: "/profissionais" as const,
			title: "Profissionais",
			description: `${catalog.professionals} cadastrado(s) — quem atende e em que horários.`,
		},
	];

	return (
		<>
			{cards.map((card) => (
				<Link href={card.href} key={card.href}>
					<Card className="h-full transition-colors hover:border-ring">
						<CardHeader>
							<CardTitle>{card.title}</CardTitle>
							<CardDescription>{card.description}</CardDescription>
						</CardHeader>
					</Card>
				</Link>
			))}
		</>
	);
}

export function CatalogSummaryCardsSkeleton() {
	return <CardGridSkeleton cards={2} />;
}
