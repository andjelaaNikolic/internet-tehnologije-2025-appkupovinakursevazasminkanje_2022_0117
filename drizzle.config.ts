import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.log("❌ GREŠKA: DATABASE_URL nije pronađen u .env fajlu!");
} else {
  console.log("✅ DATABASE_URL je uspešno učitan.");
}

// ✅ Novo: direktni export konfiguracije, bez defineConfig
export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};