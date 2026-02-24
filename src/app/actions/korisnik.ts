"use server";

import { db } from "@/db";
import { korisnik } from "@/db/schema";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

export async function dodajKorisnikaAction(data: {
  ime: string;
  prezime: string;
  email: string;
  lozinka: string;
  uloga: "ADMIN" | "KLIJENT" | "EDUKATOR";
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;

    if (!token) {
      return { success: false, error: "Niste ulogovani." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.uloga !== "ADMIN") {
        return { success: false, error: "Zabranjen pristup. Samo administrator može dodavati korisnike." };
      }
    } catch (err) {
      return { success: false, error: "Sesija nevažeća." };
    }

    const dozvoljeneUloge = ["ADMIN", "KLIJENT", "EDUKATOR"];
    if (!dozvoljeneUloge.includes(data.uloga)) {
      return { success: false, error: "Nevalidna uloga korisnika." };
    }

    const hash = await bcrypt.hash(data.lozinka, 10);

    await db.insert(korisnik).values({
      ime: data.ime,
      prezime: data.prezime,
      email: data.email,
      lozinka: hash,
      uloga: data.uloga,
      datumRegistracije: new Date(),
    });

    return { success: true };

  } catch (err: any) {
    console.error("Greška u dodajKorisnikaAction:", err);

    const msg = String(err?.message || err);
    const code = err?.code || err?.errno || err?.cause?.code;
    const constraint = err?.constraint || err?.detail || "";

    if (
      code === "23505" ||
      /unique|duplicate|already exists/i.test(msg) ||
      /email/i.test(constraint)
    ) {
      return { success: false, error: "Email adresa je već u upotrebi." };
    }

    return { success: false, error: "Sistem ne može da doda korisnika u bazu." };
  }
}