import type { InboundMessage, WhatsAppClient } from "@workspace/whatsapp";

/**
 * MVP reply: acknowledge receipt so the pipeline is testable end-to-end.
 * Will be replaced by the AI receptionist's actual response.
 */
export const RECEIPT_TEXT =
	"Recebemos sua mensagem! Em breve alguém do time vai te responder por aqui. ✅";

export async function processInboundMessage(
	message: InboundMessage,
	client: WhatsAppClient
): Promise<void> {
	await client.sendText({ to: message.from, body: RECEIPT_TEXT });
}
