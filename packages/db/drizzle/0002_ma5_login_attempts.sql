CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(45) NOT NULL,
	"email" varchar(255),
	"attempts" integer DEFAULT 0,
	"blocked_until" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "login_attempts_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
ALTER TABLE "merchant_members" ADD COLUMN "failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "merchant_members" ADD COLUMN "blocked_until" timestamp;--> statement-breakpoint
ALTER TABLE "merchant_members" ADD COLUMN "last_access_at" timestamp;