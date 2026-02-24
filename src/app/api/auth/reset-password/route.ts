import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Resetovanje lozinke pomoću tokena
 *     description: Prima tajni token iz mejla i novu lozinku, proverava da li je token validan i nije istekao, hešuje novu lozinku i ažurira je u bazi.
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
 *               - token
 *               - novaLozinka
 *             properties:
 *               token:
 *                 type: string
 *                 description: Tajni reset token dobijen u mejlu
 *                 example: "a7b8c9d0e1f2..."
 *               novaLozinka:
 *                 type: string
 *                 format: password
 *                 example: NovaSifra2025!
 *     responses:
 *       200:
 *         description: Lozinka uspešno ažurirana!
 *       400:
 *         description: Link je nevažeći, token je istekao ili lozinka je prekratka.
 *       500:
 *         description: Greška na serveru.
 */

export const POST = async function POST(req: Request) {
  try {
    // 🔑 Provera CSRF tokena
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ message: "Nevažeći CSRF token." }, { status: 403 });
    }

    const body = await req.json();
    const { token, novaLozinka } = body;

    if (!token || !novaLozinka) {
      return NextResponse.json({ message: "Token i nova lozinka su obavezni." }, { status: 400 });
    }

    if (novaLozinka.length < 6) {
      return NextResponse.json({ message: "Lozinka mora imati bar 6 karaktera." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.resetToken, token))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: "Link je nevažeći." }, { status: 400 });
    }

    const sada = new Date();
    if (!user.resetTokenExpiry || user.resetTokenExpiry < sada) {
      console.log("TOKEN ISTEKAO: ", user.resetTokenExpiry, " < ", sada);
      return NextResponse.json({ message: "Link je istekao." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaLozinka, salt);

    await db.update(korisnik)
      .set({
        lozinka: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(korisnik.id, user.id));

    return NextResponse.json({ message: "Lozinka uspešno ažurirana!" }, { status: 200 });

  } catch (error: any) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json({ message: "Greška na serveru" }, { status: 500 });
  }
};