import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
	title: "Criar barbearia · Recepcionai",
};

export default async function OnboardingPage() {
	const session = await requireSession();
	if (session.session.activeOrganizationId) {
		redirect("/dashboard");
	}
	return (
		<main className="flex min-h-svh items-center justify-center bg-background p-6">
			<div className="w-full max-w-sm">
				<OnboardingForm />
			</div>
		</main>
	);
}
