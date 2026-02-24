import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

import { csrf } from '@/lib/csrf';
/**
 * @swagger
 * /api/auth/login:
 *     summary: Prijava korisnika (Login)
 *     description: Autentifikuje korisnika, generiše JWT i postavlja ga u HTTP-only kuki. Token se NE vraća u JSON telu radi veće bezbednosti.
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
 *               - lozinka
 *             properties:
 *               email:
 *                 type: string
 *                 example: korisnik@example.com
 *               lozinka:
 *                 type: string
 *                 format: password
 *                 example: Sifra123!
 *     responses:
 *       200:
 *         description: Uspešna prijava. Podaci o korisniku su vraćeni, a token je postavljen u kuki.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     ime:
 *                       type: string
 *                     prezime:
 *                       type: string
 *                     email:
 *                       type: string
 *                     uloga:
 *                       type: string
 *       400:
 *         description: Nisu poslati svi potrebni podaci.
 *       401:
 *         description: Pogrešan email ili lozinka.
 *       500:
 *         description: Greška na serveru.
 */
export const POST = csrf(async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = (body.email || body.korisnickoIme)?.toLowerCase().trim();
    const lozinka = body.lozinka;

    if (!email || !lozinka) {
      return NextResponse.json({ message: "Nisu poslati svi podaci" }, { status: 400 });
    }

    const result = await db.select().from(korisnik).where(eq(korisnik.email, email)).limit(1);
    const user = result[0];

    if (!user) {
      return NextResponse.json({ message: "Pogrešni podaci" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(lozinka, user.lozinka);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Pogrešni podaci" }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, uloga: user.uloga },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { lozinka: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

    response.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: "Greška na serveru" }, { status: 500 });
  }
});