import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { requireActiveOrg } from "@/lib/session";
import { listWhatsappChannels } from "@/lib/tenant";

export const metadata: Metadata = {
	title: "WhatsApp · Recepcionai",
};

/**
 * Read-only by design: the channel maps an inbound `phone_number_id` from Meta
 * to this barbershop, and it is wired up by the Recepcionai team during
 * onboarding. Letting a tenant edit it would let them hijack another shop's
 * inbound messages.
 */
export default async function WhatsappPage() {
	const { organizationId } = await requireActiveOrg();
	const channels = await listWhatsappChannels(organizationId);

	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="O número que a recepcionista atende."
				title="WhatsApp"
			/>

			{channels.length === 0 ? (
				<EmptyState
					description="A equipe Recepcionai conecta o número da sua barbearia durante a configuração inicial."
					title="Nenhum número conectado"
				/>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Números conectados</CardTitle>
						<CardDescription>
							Configurado pela equipe Recepcionai. Para trocar de número, fale
							com a gente.
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
			)}
		</div>
	);
}
