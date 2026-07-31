import type { Agent } from "@workspace/agent";
import { db, schema } from "@workspace/db";
import { eq } from "@workspace/db/drizzle-orm";

export interface ResolvedTenant {
	agent: Agent;
	organizationId: string;
}

export interface TenantResolverOptions {
	/** Builds (and, per organization, spawns the tenant's bookings MCP server for) an {@link Agent}. */
	buildAgent: (organizationId: string) => Promise<Agent>;
}

/**
 * Resolves which tenant an inbound WhatsApp message belongs to, per message —
 * not once at process startup — so a single webhook/worker deployment can
 * serve many tenants, with RabbitMQ's normal competing-consumers pattern
 * doing the horizontal scaling across worker replicas.
 *
 * Each organization's agent (and the bookings MCP server child process it
 * holds) is built lazily on first message and cached for the process's
 * lifetime, so it isn't rebuilt per message.
 */
export class TenantResolver {
	readonly #agentsByOrganization = new Map<string, Promise<Agent>>();
	readonly #buildAgent: (organizationId: string) => Promise<Agent>;

	constructor(options: TenantResolverOptions) {
		this.#buildAgent = options.buildAgent;
	}

	async resolveAgent(phoneNumberId: string): Promise<ResolvedTenant | null> {
		const channel = await db.query.whatsappChannel.findFirst({
			where: eq(schema.whatsappChannel.phoneNumberId, phoneNumberId),
		});
		if (!channel) {
			return null;
		}

		let agentPromise = this.#agentsByOrganization.get(channel.organizationId);
		if (!agentPromise) {
			agentPromise = this.#buildAgent(channel.organizationId);
			this.#agentsByOrganization.set(channel.organizationId, agentPromise);
		}

		return {
			agent: await agentPromise,
			organizationId: channel.organizationId,
		};
	}
}
