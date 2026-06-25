import { NextResponse } from "next/server";

/**
 * Centralized WhatsApp deep-link.
 *
 * Every CTA on the site points at `/whatsapp`; this handler issues a 307 to the
 * real wa.me URL with the pre-filled opener. Change the phone number or the
 * pre-fill message here and every CTA picks it up.
 *
 * Implemented as a Route Handler instead of a `next.config.ts` redirect because
 * Turbopack dev mode currently omits the `Location` header on external
 * destinations declared in the redirects config.
 */
const WHATSAPP_DEEP_LINK =
	"https://wa.me/5547997582124?text=Ol%C3%A1%2C%20acabei%20de%20ver%20a%20p%C3%A1gina%20do%20Recepcionai.%20Gostaria%20de%20agendar%20uma%20demonstra%C3%A7%C3%A3o.";

export function GET() {
	return NextResponse.redirect(WHATSAPP_DEEP_LINK, 307);
}
