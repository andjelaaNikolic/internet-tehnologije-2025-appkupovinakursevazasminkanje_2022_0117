import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/db"; // Putanja do tvoje drizzle konfiguracije
import { korisnik } from "@/db/schema"; // Putanja do tvoje tabele u šemi
import { eq } from "drizzle-orm";

const JWT_SECRET = "tvoja_tajna_sifra_123"; // Ovo bi trebalo da ide u .env fajl

export async function POST(req: Request) {
  try {
    const { email, lozinka } = await req.json();

    // 1. Pronađi korisnika u bazi preko korisničkog imena
    const [user] = await db.select()
      .from(korisnik)
      .where(eq(korisnik.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "Korisnik ne postoji" }, { status: 401 });
    }

    // 2. Proveri da li je lozinka ispravna (pomoću bcrypt-a)
    const passwordMatch = await bcrypt.compare(lozinka, user.lozinka);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Pogrešna lozinka" }, { status: 401 });
    }

    // 3. Generiši JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Vrati uspeh i podatke (bez lozinke!)
    const { lozinka: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Greška na serveru" }, { status: 500 });
  }
}