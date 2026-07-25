import { createAuthClient, organizationClient } from "@workspace/auth";

export const authClient = createAuthClient({
	plugins: [organizationClient()],
});
