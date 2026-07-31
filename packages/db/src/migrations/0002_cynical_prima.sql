CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_phone" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"wa_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_organizationId_idx" ON "conversation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversation_organizationId_customerPhone_idx" ON "conversation" USING btree ("organization_id","customer_phone");--> statement-breakpoint
CREATE INDEX "conversation_message_conversationId_idx" ON "conversation_message" USING btree ("conversation_id");