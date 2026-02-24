ALTER TABLE "korisnik" ADD COLUMN "reset_token" varchar;--> statement-breakpoint
ALTER TABLE "korisnik" ADD COLUMN "reset_token_expiry" timestamp with time zone;