import { Badge } from "@workspace/ui/components/badge";
import { CONVERSATION_STATUSES } from "@/lib/tenant";

const VARIANTS: Record<string, "secondary" | "outline" | "default"> = {
	open: "default",
	handed_off: "secondary",
	closed: "outline",
};

export function StatusBadge({ status }: { status: string }) {
	const label =
		CONVERSATION_STATUSES.find((option) => option.value === status)?.label ??
		status;
	return <Badge variant={VARIANTS[status] ?? "outline"}>{label}</Badge>;
}
