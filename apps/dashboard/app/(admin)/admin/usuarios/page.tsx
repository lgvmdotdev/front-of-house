import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionError } from "@/components/ui/section-error";
import {
	UsersTable,
	UsersTableSkeleton,
} from "@/features/user/components/users-table";

export const metadata: Metadata = {
	title: "Usuários · Recepcionai",
};

export default function UsuariosPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Todos os usuários da plataforma."
				title="Usuários"
			/>
			<SectionError title="Não foi possível carregar os usuários">
				<Suspense fallback={<UsersTableSkeleton />}>
					<UsersTable />
				</Suspense>
			</SectionError>
		</div>
	);
}
