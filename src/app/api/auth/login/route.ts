import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyCsrfToken } from "@/lib/csrf";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

export async function POST(req: Request) {
  try {
    // 🔑 CSRF provera (SAMO token, bez CSRF_SECRET)
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json(
        { success: false, error: "Nevalidan CSRF token." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const email = (body.email || body.korisnickoIme)?.toLowerCase().trim();
    const lozinka = body.lozinka;

    if (!email || !lozinka) {
      return NextResponse.json(
        { success: false, error: "Nisu poslati svi podaci." },
        { status: 400 }
      );
    }

    // 🔑 Provera korisnika
    const result = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.email, email))
      .limit(1);

    const user = result[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pogrešni podaci." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(lozinka, user.lozinka);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Pogrešni podaci." },
        { status: 401 }
      );
    }

    // 🔑 Generisanje JWT tokena
    const token = jwt.sign(
      { sub: user.id, email: user.email, uloga: user.uloga },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { lozinka: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

    // 🔐 HTTP-only cookie
    response.cookies.set("auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru." },
      { status: 500 }
    );
  }
}