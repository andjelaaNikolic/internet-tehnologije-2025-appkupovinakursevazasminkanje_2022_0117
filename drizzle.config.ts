import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Eksplicitno učitavanje .env fajla
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.log("❌ GREŠKA: DATABASE_URL nije pronađen u .env fajlu!");
} else {
  console.log("✅ DATABASE_URL je uspešno učitan.");
}

export default defineConfig({
  schema: "./src/db/schema.ts", // Proveri da li je ovo tačna putanja do tvoje šeme
  out: "./drizzle",
  dialect: "***REMOVED***ql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Koristi 'url' za Postgres
  },
});