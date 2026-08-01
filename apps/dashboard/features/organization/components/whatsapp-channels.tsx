import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { formatDate } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { listWhatsappChannels } from "../organization-queries";

/**
 * Read-only by design: the channel maps an inbound `phone_number_id` from Meta
 * to this barbershop, and the Recepcionai team wires it up during onboarding.
 * Letting a tenant edit it would let them hijack another shop's inbound
 * messages.
 */
export async function WhatsappChannels() {
	const { organizationId } = await requireActiveOrg();
	const channels = await listWhatsappChannels(organizationId);

	if (channels.length === 0) {
		return (
			<EmptyState
				description="A equipe Recepcionai conecta o número da sua barbearia durante a configuração inicial."
				title="Nenhum número conectado"
			/>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Números conectados</CardTitle>
				<CardDescription>
					Configurado pela equipe Recepcionai. Para trocar de número, fale com a
					gente.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID do número (Meta)</TableHead>
							<TableHead>Conectado em</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{channels.map((channel) => (
							<TableRow key={channel.id}>
								<TableCell className="font-mono text-xs">
									{channel.phoneNumberId}
								</TableCell>
								<TableCell>{formatDate(channel.createdAt)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export function WhatsappChannelsSkeleton() {
	return (
		<div aria-hidden className="flex flex-col gap-6 rounded-xl border p-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<TableSkeleton columns={2} rows={1} />
		</div>
	);
}

/**
 * The overview's connection badge. Its own tiny boundary in the page header, so
 * the heading beside it paints without waiting on the channel read.
 */
export async function WhatsappStatusBadge() {
	const { organizationId } = await requireActiveOrg();
	const channels = await listWhatsappChannels(organizationId);
	const connected = channels.length > 0;
	return (
		<Badge variant={connected ? "secondary" : "outline"}>
			{connected ? "WhatsApp conectado" : "WhatsApp não conectado"}
		</Badge>
	);
}

export function WhatsappStatusBadgeSkeleton() {
	return <Skeleton aria-hidden className="h-6 w-44 rounded-full" />;
}
