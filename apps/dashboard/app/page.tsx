import { redirect } from "next/navigation";

/** The dashboard has no landing page of its own — go straight to the panel. */
export default function RootPage() {
	redirect("/painel");
}
