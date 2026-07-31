import { describe, expect, test } from "bun:test";
import type { Professional, Service } from "@workspace/bookings";
import { buildSystemPrompt } from "./prompt";

const CORTE: Service = {
	id: "svc-corte",
	name: "Corte",
	durationMinutes: 60,
	price: { amountCents: 5000, currency: "BRL" },
};
const JOAO: Professional = {
	id: "prof-joao",
	name: "João",
	serviceIds: ["svc-corte"],
	workingHours: [{ weekday: 1, start: "09:00", end: "18:00" }],
};

describe("buildSystemPrompt", () => {
	test("includes the shop name", () => {
		const prompt = buildSystemPrompt({
			shopName: "Barbearia do Zé",
			services: [],
			professionals: [],
		});

		expect(prompt).toContain("Barbearia do Zé");
	});

	test("includes each service's name, price in reais, and duration", () => {
		const prompt = buildSystemPrompt({
			shopName: "Barbearia do Zé",
			services: [CORTE],
			professionals: [],
		});

		expect(prompt).toContain("Corte");
		expect(prompt).toContain("50");
		expect(prompt).toContain("60");
	});

	test("includes each professional's name", () => {
		const prompt = buildSystemPrompt({
			shopName: "Barbearia do Zé",
			services: [CORTE],
			professionals: [JOAO],
		});

		expect(prompt).toContain("João");
	});

	test("says something sensible when there's no catalog yet", () => {
		const prompt = buildSystemPrompt({
			shopName: "Barbearia do Zé",
			services: [],
			professionals: [],
		});

		expect(prompt.length).toBeGreaterThan(0);
	});
});
