import { NextResponse } from "next/server";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { csrf } from '@/lib/csrf';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registracija novog korisnika
 *     description: Kreira novi korisnički nalog u bazi podataka. Lozinka se hešuje pomoću bcrypt-a, a podrazumevana uloga (role) je automatski postavljena na "KLIJENT" radi bezbednosti.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-csrf-token
 *         schema:
 *           type: string
 *         required: true
 *         description: CSRF zaštita - unesite vrednost CSRF tokena
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ime
 *               - prezime
 *               - email
 *               - lozinka
 *             properties:
 *               ime:
 *                 type: string
 *                 example: Marija
 *               prezime:
 *                 type: string
 *                 example: Marković
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marija@example.com
 *               lozinka:
 *                 type: string
 *                 format: password
 *                 example: MojaSigurnaSifra123
 *     responses:
 *       201:
 *         description: Uspešna registracija. Korisnik je kreiran.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Uspešna registracija!
 *       400:
 *         description: Loš zahtev. Podaci su nepotpuni, lozinka je prekratka ili email već postoji.
 *       500:
 *         description: Greška na serveru.
 */
export const POST = csrf(async function POST(req: Request) {
  try {
    const body = await req.json();

    const ime = body.ime?.trim();
    const prezime = body.prezime?.trim();
    const email = body.email?.toLowerCase().trim();
    const lozinka = body.lozinka;

    if (!ime || !prezime || !email || !lozinka) {
      return NextResponse.json(
        { success: false, message: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    if (lozinka.length < 6) {
      return NextResponse.json(
        { success: false, message: "Lozinka mora imati najmanje 6 karaktera." },
        { status: 400 }
      );
    }

    const postojeciKorisnik = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.email, email))
      .limit(1);

    if (postojeciKorisnik.length > 0) {
      return NextResponse.json(
        { success: false, message: "Korisnik sa ovim emailom već postoji." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(lozinka, 10);

    await db.insert(korisnik).values({
      ime,
      prezime,
      email,
      lozinka: hashedPassword,
      uloga: "KLIJENT",
    });

    return NextResponse.json(
      { success: true, message: "Uspešna registracija!" },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Greška pri registraciji:", error);
    return NextResponse.json(
      { success: false, message: "Došlo je do greške na serveru." },
      { status: 500 }
    );
  }
});