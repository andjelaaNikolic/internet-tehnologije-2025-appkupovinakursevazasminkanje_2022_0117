import { NextResponse } from "next/server";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { verifyCsrfToken } from "@/lib/csrf";

export const POST = async function POST(req: Request) {
  try {
    // 🔐 CSRF provera
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json(
        { success: false, error: "Nevažeći CSRF token." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const ime = body.ime?.trim();
    const prezime = body.prezime?.trim();
    const email = body.email?.toLowerCase().trim();
    const lozinka = body.lozinka;

    // 🔹 Provera svih polja
    if (!ime || !prezime || !email || !lozinka) {
      return NextResponse.json(
        { success: false, error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    // 🔹 Minimalna dužina lozinke
    if (lozinka.length < 6) {
      return NextResponse.json(
        { success: false, error: "Lozinka mora imati najmanje 6 karaktera." },
        { status: 400 }
      );
    }

    // 🔹 Provera da li korisnik već postoji
    const postojeciKorisnik = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.email, email))
      .limit(1);

    if (postojeciKorisnik.length > 0) {
      return NextResponse.json(
        { success: false, error: "Korisnik sa ovim emailom već postoji." },
        { status: 400 }
      );
    }

    // 🔹 Hešovanje lozinke
    const hashedPassword = await bcrypt.hash(lozinka, 10);

    await db.insert(korisnik).values({
      ime,
      prezime,
      email,
      lozinka: hashedPassword,
      uloga: "KLIJENT", // default role
    });

    return NextResponse.json(
      { success: true, message: "Uspešna registracija!" },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Greška pri registraciji:", error);
    return NextResponse.json(
      { success: false, error: "Došlo je do greške na serveru." },
      { status: 500 }
    );
  }
};