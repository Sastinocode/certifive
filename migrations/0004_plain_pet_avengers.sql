CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"subcategory" varchar,
	"expense_date" timestamp NOT NULL,
	"receipt_url" varchar,
	"receipt_number" varchar,
	"vendor" varchar,
	"vendor_nif" varchar,
	"is_deductible" boolean DEFAULT true,
	"vat_amount" numeric(10, 2) DEFAULT '0.00',
	"vat_rate" numeric(5, 2) DEFAULT '21.00',
	"certification_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"certification_id" integer,
	"quote_request_id" integer,
	"invoice_number" varchar NOT NULL,
	"series" varchar DEFAULT 'CERT',
	"client_name" varchar NOT NULL,
	"client_email" varchar,
	"client_phone" varchar,
	"client_address" text,
	"client_nif" varchar,
	"client_city" varchar,
	"client_postal_code" varchar,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '21.00',
	"vat_amount" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"irpf_rate" numeric(5, 2) DEFAULT '0.00',
	"irpf_amount" numeric(10, 2) DEFAULT '0.00',
	"payment_status" varchar DEFAULT 'pending',
	"payment_method" varchar,
	"payment_terms" integer DEFAULT 30,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"paid_amount" numeric(10, 2) DEFAULT '0.00',
	"description" text NOT NULL,
	"line_items" jsonb,
	"notes" text,
	"issue_date" timestamp DEFAULT now(),
	"service_date" timestamp,
	"pdf_url" varchar,
	"sent_date" timestamp,
	"sent_count" integer DEFAULT 0,
	"is_rectification" boolean DEFAULT false,
	"original_invoice_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"payment_reference" varchar,
	"payment_date" timestamp DEFAULT now(),
	"bank_account" varchar,
	"bank_name" varchar,
	"stripe_payment_intent_id" varchar,
	"stripe_charge_id" varchar,
	"notes" text,
	"status" varchar DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_request_id_quote_requests_id_fk" FOREIGN KEY ("quote_request_id") REFERENCES "public"."quote_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_original_invoice_id_invoices_id_fk" FOREIGN KEY ("original_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;