CREATE TABLE "pricing_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"property_type" varchar NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"advance_percentage" integer DEFAULT 50 NOT NULL,
	"delivery_days" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"unique_link" varchar NOT NULL,
	"client_name" varchar,
	"client_email" varchar,
	"client_phone" varchar,
	"property_type" varchar,
	"address" text,
	"floors" integer,
	"rooms" integer,
	"area" numeric(10, 2),
	"build_year" integer,
	"additional_info" text,
	"base_price" numeric(10, 2),
	"advance_amount" numeric(10, 2),
	"delivery_days" integer,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"accepted_at" timestamp,
	"paid_at" timestamp,
	"stripe_payment_intent_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quote_requests_unique_link_unique" UNIQUE("unique_link")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_onboarding_complete" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pricing_rates" ADD CONSTRAINT "pricing_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;