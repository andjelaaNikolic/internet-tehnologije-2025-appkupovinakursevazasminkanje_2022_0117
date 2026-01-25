CREATE TYPE "public"."uloga" AS ENUM('ADMIN', 'KLIJENT', 'EDUKATOR');--> statement-breakpoint
CREATE TABLE "korisnik" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ime" varchar(100) NOT NULL,
	"prezime" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"lozinka" varchar(255) NOT NULL,
	"uloga" "uloga" NOT NULL,
	CONSTRAINT "korisnik_email_unique" UNIQUE("email")
);
