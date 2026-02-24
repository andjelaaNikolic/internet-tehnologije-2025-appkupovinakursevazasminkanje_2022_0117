import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Slanje mejla za resetovanje lozinke
 *     description: Prima korisnički email, generiše siguran reset token, čuva ga u bazi i šalje link sa tokenom putem Nodemailer-a.
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: korisnik@gmail.com
 *     responses:
 *       200:
 *         description: Email uspešno poslat! (Ili generička poruka radi bezbednosti)
 *       400:
 *         description: Email je obavezno polje.
 *       500:
 *         description: Greška na serveru (problem sa bazom ili Gmail servisom).
 */

export const POST = async function POST(req: Request) {
  try {
    // 🔑 Provera CSRF tokena
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ message: "Nevažeći CSRF token." }, { status: 403 });
    }

    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ message: "Email je obavezan" }, { status: 400 });
    }

    const [user] = await db.select().from(korisnik).where(eq(korisnik.email, email)).limit(1);

    if (!user) {
      return NextResponse.json({
        message: "Ako nalog postoji, instrukcije su poslate na email."
      }, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 sat

    await db.update(korisnik)
      .set({ resetToken, resetTokenExpiry: expiry })
      .where(eq(korisnik.id, user.id));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || "insensitivo.makeup@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD || "nelu spho gnzj fvom",
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Insensitivo Makeup" <${process.env.GMAIL_USER || 'insensitivo.makeup@gmail.com'}>`,
      to: email,
      subject: "Promena lozinke",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; background-color: #fdfaf8; padding: 40px; border-radius: 15px;">
          <h2 style="color: #AD8B73;">Insensitivo Makeup</h2>
          <p>Primili smo zahtev za promenu lozinke.</p>
          <p>Kliknite na dugme ispod da biste postavili novu lozinku (link važi 1 sat):</p>
          <br>
          <a href="${resetLink}" style="background-color: #AD8B73; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            POSTAVI NOVU LOZINKU
          </a>
          <br><br>
          <p style="color: #999; font-size: 12px;">Ako niste tražili promenu, ignorišite ovaj mejl.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Email uspešno poslat!" }, { status: 200 });

  } catch (error: any) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json({ message: "Greška na serveru" }, { status: 500 });
  }
};