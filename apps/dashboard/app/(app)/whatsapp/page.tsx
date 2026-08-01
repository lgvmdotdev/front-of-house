import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	WhatsappChannels,
	WhatsappChannelsSkeleton,
} from "@/features/organization/components/whatsapp-channels";

export const metadata: Metadata = {
	title: "WhatsApp · Recepcionai",
};

export default function WhatsappPage() {
	return (
		<div className="flex max-w-2xl flex-col gap-6">
			<PageHeader
				description="O número que a recepcionista atende."
				title="WhatsApp"
			/>
			<SectionError title="Não foi possível carregar os números">
				<Suspense fallback={<WhatsappChannelsSkeleton />}>
					<WhatsappChannels />
				</Suspense>
			</SectionError>
		</div>
	);
}
