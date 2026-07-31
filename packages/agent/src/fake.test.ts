import { describe, expect, test } from "bun:test";
import { FakeAgent } from "./fake";

describe("FakeAgent", () => {
	test("records every call and returns the configured reply", async () => {
		const agent = new FakeAgent("Recebemos sua mensagem!");

		const result = await agent.respond({
			organizationId: "org-1",
			customerPhone: "5547999998888",
			message: "oi",
		});

		expect(result).toEqual({ reply: "Recebemos sua mensagem!" });
		expect(agent.calls).toEqual([
			{
				organizationId: "org-1",
				customerPhone: "5547999998888",
				message: "oi",
			},
		]);
	});

	test("defaults to a generic reply when none is configured", async () => {
		const agent = new FakeAgent();

		const result = await agent.respond({
			organizationId: "org-1",
			customerPhone: "5547999998888",
			message: "oi",
		});

		expect(result.reply).toBe("ok");
	});
});
