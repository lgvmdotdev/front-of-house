CREATE TABLE "whatsapp_channel" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_channel_phone_number_id_unique" UNIQUE("phone_number_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_channel" ADD CONSTRAINT "whatsapp_channel_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;