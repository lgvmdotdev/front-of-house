import type { Metadata } from "next";
import { UsersManager } from "@/components/admin/users-manager";
import { listPlatformUsers } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
	title: "Usuários · Recepcionai",
};

export default async function UsuariosPage() {
	const session = await requireAdmin();
	const users = await listPlatformUsers();
	return <UsersManager currentUserId={session.user.id} users={users} />;
}
