CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"dni" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"cadastral_ref" varchar NOT NULL,
	"phone" varchar,
	"email" varchar,
	"floors" integer,
	"rooms" integer,
	"facade_orientation" text,
	"roof_type" varchar,
	"windows" jsonb,
	"hvac_system" varchar,
	"heating_system" varchar,
	"water_heating_type" varchar,
	"water_heating_capacity" integer,
	"energy_rating" varchar(1),
	"energy_consumption" numeric(10, 2),
	"co2_emissions" numeric(10, 2),
	"status" varchar DEFAULT 'draft' NOT NULL,
	"photos" jsonb,
	"certificate_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");