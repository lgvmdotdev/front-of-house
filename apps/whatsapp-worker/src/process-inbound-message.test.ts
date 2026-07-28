import { describe, expect, test } from "bun:test";
import { FakeWhatsAppClient, type InboundMessage } from "@workspace/whatsapp";
import { processInboundMessage, RECEIPT_TEXT } from "./process-inbound-message";

const MESSAGE: InboundMessage = {
	waMessageId: "wamid.ABC123",
	phoneNumberId: "123456123",
	from: "5547999998888",
	timestamp: "1735000000",
	type: "text",
	text: "Oi, quero marcar um horário",
};

describe("processInboundMessage", () => {
	test("sends a receipt reply back to the sender", async () => {
		const client = new FakeWhatsAppClient();

		await processInboundMessage(MESSAGE, client);

		expect(client.sent).toEqual([{ to: MESSAGE.from, body: RECEIPT_TEXT }]);
	});
});
