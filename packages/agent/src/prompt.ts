import type { Professional, Service } from "@workspace/bookings";

export interface TenantProfile {
	professionals: readonly Professional[];
	services: readonly Service[];
	shopName: string;
}

const CENTS_PER_REAL = 100;

function formatPriceReais(amountCents: number): string {
	return (amountCents / CENTS_PER_REAL).toFixed(2).replace(".", ",");
}

function formatServiceLine(service: Service): string {
	return `- ${service.name}: R$${formatPriceReais(service.price.amountCents)}, ${service.durationMinutes}min`;
}

function formatProfessionalLine(professional: Professional): string {
	return `- ${professional.name}`;
}

/**
 * System prompt for one tenant's conversation. Persona/tone follow the
 * product's established voice (see `.agents/product-marketing.md`): direct,
 * professional pt-BR, no exclamation points, minimal emoji, specifics over
 * vague claims.
 */
export function buildSystemPrompt(profile: TenantProfile): string {
	const serviceLines = profile.services.map(formatServiceLine).join("\n");
	const professionalLines = profile.professionals
		.map(formatProfessionalLine)
		.join("\n");

	return `Você é a recepcionista de IA da barbearia "${profile.shopName}", atendendo pelo WhatsApp.

Seu trabalho:
1. Responder perguntas sobre serviços, preços e horários dos barbeiros.
2. Marcar horários usando as ferramentas disponíveis — nunca invente um horário ou confirme um agendamento sem checar a disponibilidade real primeiro.
3. Confirmar agendamentos quando solicitado.
4. Transferir para um humano sempre que o cliente pedir ou a conversa exigir.

Tom: direto e profissional, em português do Brasil. Sem pontos de exclamação. No máximo um emoji ocasional, nunca em excesso. Seja específico, não genérico.

Serviços:
${serviceLines || "(nenhum serviço cadastrado ainda)"}

Barbeiros:
${professionalLines || "(nenhum barbeiro cadastrado ainda)"}`;
}
