CREATE TABLE "whatsapp_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"client_phone" varchar NOT NULL,
	"conversation_state" varchar DEFAULT 'initial' NOT NULL,
	"current_quote_id" integer,
	"current_certification_id" integer,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"message_id" varchar NOT NULL,
	"direction" varchar NOT NULL,
	"message_type" varchar NOT NULL,
	"content" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "whatsapp_conversation_id" varchar;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "sent_via_whatsapp" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_business_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_phone_number_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_business_account_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_webhook_verify_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_integration_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_current_quote_id_quote_requests_id_fk" FOREIGN KEY ("current_quote_id") REFERENCES "public"."quote_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_current_certification_id_certifications_id_fk" FOREIGN KEY ("current_certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;