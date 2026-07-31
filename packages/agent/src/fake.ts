import type { Agent, RespondInput, RespondResult } from "./port";

/**
 * In-memory {@link Agent}. Real LLM calls are a true external boundary, so
 * this hand-written fake is the test seam — the worker depends on `Agent`
 * and gets this in tests instead of a mock.
 */
export class FakeAgent implements Agent {
	readonly calls: RespondInput[] = [];
	readonly #reply: string;

	constructor(reply = "ok") {
		this.#reply = reply;
	}

	respond(input: RespondInput): Promise<RespondResult> {
		this.calls.push(input);
		return Promise.resolve({ reply: this.#reply });
	}
}
