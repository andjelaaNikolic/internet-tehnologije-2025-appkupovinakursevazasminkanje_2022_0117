import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db"; // Prilagodi putanju svom db fajlu
import { kupljeniKursevi, kurs } from "@/db/schema"; // Prilagodi putanju shemi
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ message: "Niste ulogovani." }, { status: 401 });
    }

    const decoded = jwt.decode(token) as any;

    if (!decoded || decoded.uloga !== "KLIJENT") {
      return NextResponse.json({ message: "Pristup dozvoljen samo klijentima." }, { status: 403 });
    }

    const klijentId = decoded.id || decoded.sub;
    // Tvoja baza podataka logika:
    const mojiKursevi = await db
      .select()
      .from(kupljeniKursevi)
      .where(eq(kupljeniKursevi.korisnikId, klijentId));

    return NextResponse.json(mojiKursevi, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}