import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";

/**
 * Per-barbershop booking catalog: services, professionals (barbers), the
 * services each performs, and their weekly working hours. This is our system of
 * record; rows are mapped into `@workspace/bookings` config to drive the booking
 * engine. Every row is scoped to an `organization` (the shop).
 *
 * Conventions follow `auth.ts`: app-generated text PKs, snake_case columns,
 * `created_at`/`updated_at` (with `$onUpdate`), `<table>_<col>_idx` indexes.
 */

export const service = pgTable(
	"service",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		durationMinutes: integer("duration_minutes").notNull(),
		priceCents: integer("price_cents").notNull(),
		active: boolean("active").default(true).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull()
			.defaultNow(),
	},
	(table) => [index("service_organizationId_idx").on(table.organizationId)]
);

export const professional = pgTable(
	"professional",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		/** Google Calendar id this barber books into (Calendar adapter). */
		calendarId: text("calendar_id"),
		active: boolean("active").default(true).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull()
			.defaultNow(),
	},
	(table) => [index("professional_organizationId_idx").on(table.organizationId)]
);

/** Which services a professional performs (many-to-many). */
export const professionalService = pgTable(
	"professional_service",
	{
		professionalId: text("professional_id")
			.notNull()
			.references(() => professional.id, { onDelete: "cascade" }),
		serviceId: text("service_id")
			.notNull()
			.references(() => service.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.professionalId, table.serviceId] }),
		index("professional_service_serviceId_idx").on(table.serviceId),
	]
);

/** One row per weekly working window; multiple per weekday allow split shifts. */
export const workingHours = pgTable(
	"working_hours",
	{
		id: text("id").primaryKey(),
		professionalId: text("professional_id")
			.notNull()
			.references(() => professional.id, { onDelete: "cascade" }),
		/** 0 = Sunday … 6 = Saturday. */
		weekday: integer("weekday").notNull(),
		/** Local "HH:MM". */
		start: text("start").notNull(),
		/** Local "HH:MM". */
		end: text("end").notNull(),
	},
	(table) => [
		index("working_hours_professionalId_idx").on(table.professionalId),
	]
);

/** Booking-backend configuration for a shop (one row per organization). */
export const integrationSettings = pgTable("integration_settings", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.unique()
		.references(() => organization.id, { onDelete: "cascade" }),
	provider: text("provider").notNull(),
	spreadsheetId: text("spreadsheet_id"),
	offsetMinutes: integer("offset_minutes").default(-180).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => new Date())
		.notNull()
		.defaultNow(),
});

export const serviceRelations = relations(service, ({ one, many }) => ({
	organization: one(organization, {
		fields: [service.organizationId],
		references: [organization.id],
	}),
	professionals: many(professionalService),
}));

export const professionalRelations = relations(
	professional,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [professional.organizationId],
			references: [organization.id],
		}),
		services: many(professionalService),
		workingHours: many(workingHours),
	})
);

export const professionalServiceRelations = relations(
	professionalService,
	({ one }) => ({
		professional: one(professional, {
			fields: [professionalService.professionalId],
			references: [professional.id],
		}),
		service: one(service, {
			fields: [professionalService.serviceId],
			references: [service.id],
		}),
	})
);

export const workingHoursRelations = relations(workingHours, ({ one }) => ({
	professional: one(professional, {
		fields: [workingHours.professionalId],
		references: [professional.id],
	}),
}));
