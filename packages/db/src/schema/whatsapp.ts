import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

/**
 * Maps an inbound WhatsApp `phone_number_id` to the organization (shop) it
 * belongs to — the seam that lets one webhook/worker deployment serve many
 * tenants, resolving the tenant per message rather than pinning one org per
 * process. Credentials (access token, app secret) stay app-level env config
 * for now, shared across tenants under one Meta App; once Embedded Signup
 * (Tech Provider) lands and each tenant brings its own WABA/number, this is
 * the table that grows a per-row `accessToken` column.
 */
export const whatsappChannel = pgTable("whatsapp_channel", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	phoneNumberId: text("phone_number_id").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
