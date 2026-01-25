import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Promeni na bcryptjs ako možeš (npm install bcryptjs)
import jwt from "jsonwebtoken";
import { db } from "@/db"; 
import { korisnik } from "@/db/schema"; 
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Podaci stigli na backend:", body); // OVO ĆEŠ VIDETI U TERMINALU

    // SINHRONIZACIJA: Proveri da li frontend šalje 'email' ili 'korisnickoIme'
    const identifikator = body.email || body.korisnickoIme;
    const lozinka = body.lozinka;

    if (!identifikator || !lozinka) {
      return NextResponse.json({ message: "Nisu poslati svi podaci" }, { status: 400 });
    }

    // 1. Pretraga u bazi
    // VAŽNO: Proveri da li se u tvojoj šemi polje zove 'email' ili 'korisnickoIme'
    const result = await db.select()
      .from(korisnik)
      .where(eq(korisnik.email, identifikator)) // Ako u bazi imaš korisnickoIme, promeni ovo
      .limit(1);

    const user = result[0];

    if (!user) {
      console.log("Korisnik nije pronađen u bazi");
      return NextResponse.json({ message: "Pogrešni podaci" }, { status: 401 });
    }

    // 2. Provera lozinke
    // Pazi: user.lozinka mora biti HEŠIRANA u bazi, inače bcrypt.compare neće raditi
    const passwordMatch = await bcrypt.compare(lozinka, user.lozinka);
    
    if (!passwordMatch) {
      console.log("Lozinka se ne poklapa");
      return NextResponse.json({ message: "Pogrešni podaci" }, { status: 401 });
    }

    // 3. Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Slanje odgovora
    const { lozinka: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      token,
      user: userWithoutPassword
    });

  } catch (error: any) {
    // OVDE ĆE TI SADA ISPISATI TAČNO ŠTA NE VALJA U VS CODE TERMINALU
    console.error("KRITIČNA GREŠKA NA BACKENDU:", error.message);
    return NextResponse.json({ message: "Greška na serveru: " + error.message }, { status: 500 });
  }
}