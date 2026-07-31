import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { JWT } from "google-auth-library";
import { createBookingEngineForOrg } from "./factory";
import { FakeBookingEngine } from "./fake";
import { createBookingsMcpServer } from "./mcp-server";
import type { BookingEngine } from "./port";
import type { Professional, Service } from "./types";

/**
 * Runnable entrypoint — the agent spawns this as a stdio child process (one
 * per tenant). Not unit tested itself, same as `apps/*\/src/{server,worker}.ts`
 * — it's composition, the tested logic lives in `factory.ts`/`mcp-server.ts`.
 *
 * Falls back to demo data when no Google credentials are configured yet, so
 * the whole webhook -> worker -> agent -> reply pipeline stays runnable
 * before a real Google service account / org catalog exist. Swap in
 * ORGANIZATION_ID + GOOGLE_SERVICE_ACCOUNT_* to use real tenant data.
 */

const DEMO_SERVICES: Service[] = [
	{
		id: "svc-corte",
		name: "Corte",
		durationMinutes: 60,
		price: { amountCents: 5000, currency: "BRL" },
	},
	{
		id: "svc-barba",
		name: "Barba",
		durationMinutes: 30,
		price: { amountCents: 3000, currency: "BRL" },
	},
];

const DEMO_PROFESSIONALS: Professional[] = [
	{
		id: "prof-demo",
		name: "Barbeiro Demo",
		serviceIds: ["svc-corte", "svc-barba"],
		workingHours: [1, 2, 3, 4, 5].map((weekday) => ({
			weekday: weekday as 1 | 2 | 3 | 4 | 5,
			start: "09:00",
			end: "18:00",
		})),
	},
];

function resolveEngine(): Promise<BookingEngine> {
	const organizationId = process.env.ORGANIZATION_ID;
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

	if (organizationId && email && key) {
		const googleAuth = new JWT({
			email,
			key: key.replace(/\\n/g, "\n"),
			scopes: [
				"https://www.googleapis.com/auth/calendar",
				"https://www.googleapis.com/auth/spreadsheets",
			],
		});
		return createBookingEngineForOrg(organizationId, { googleAuth });
	}

	return Promise.resolve(
		new FakeBookingEngine({
			services: DEMO_SERVICES,
			professionals: DEMO_PROFESSIONALS,
		})
	);
}

const engine = await resolveEngine();
const server = createBookingsMcpServer(engine);
await server.connect(new StdioServerTransport());
