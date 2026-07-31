/** pt-BR display helpers shared across the panel screens. */

const CENTS_PER_REAL = 100;

const currencyFormat = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
	dateStyle: "short",
	timeStyle: "short",
});

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export function formatCents(cents: number): string {
	return currencyFormat.format(cents / CENTS_PER_REAL);
}

export function centsToInput(cents: number): string {
	return (cents / CENTS_PER_REAL).toFixed(2);
}

export function inputToCents(value: string): number {
	return Math.round(Number(value) * CENTS_PER_REAL);
}

export function formatDateTime(value: Date): string {
	return dateTimeFormat.format(value);
}

export function formatDate(value: Date): string {
	return dateFormat.format(value);
}

/**
 * WhatsApp stores an E.164 number with no `+`. Render the Brazilian shape when
 * it looks like one, otherwise leave the digits alone.
 */
const BR_MOBILE = /^55(\d{2})(\d{5})(\d{4})$/;
const BR_LANDLINE = /^55(\d{2})(\d{4})(\d{4})$/;

export function formatPhone(waId: string): string {
	const mobile = BR_MOBILE.exec(waId);
	if (mobile) {
		return `+55 (${mobile[1]}) ${mobile[2]}-${mobile[3]}`;
	}
	const landline = BR_LANDLINE.exec(waId);
	if (landline) {
		return `+55 (${landline[1]}) ${landline[2]}-${landline[3]}`;
	}
	return waId;
}

/** UTC offset in minutes as an operator-readable "UTC-03:00". */
export function formatUtcOffset(offsetMinutes: number): string {
	const sign = offsetMinutes < 0 ? "-" : "+";
	const absolute = Math.abs(offsetMinutes);
	const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
	const minutes = String(absolute % 60).padStart(2, "0");
	return `UTC${sign}${hours}:${minutes}`;
}
