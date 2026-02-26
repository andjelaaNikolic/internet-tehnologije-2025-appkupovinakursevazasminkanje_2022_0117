import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = async function POST(req: Request) {
  try {
    const { token, novaLozinka } = await req.json();

    if (!token || !novaLozinka) {
      return NextResponse.json(
        { success: false, error: "Token i nova lozinka su obavezni." },
        { status: 400 }
      );
    }

    if (novaLozinka.length < 6) {
      return NextResponse.json(
        { success: false, error: "Lozinka mora imati bar 6 karaktera." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.resetToken, token))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Link je nevažeći." },
        { status: 400 }
      );
    }

    const sada = new Date();
    if (!user.resetTokenExpiry || user.resetTokenExpiry < sada) {
      console.log("TOKEN ISTEKAO:", user.resetTokenExpiry, "<", sada);
      return NextResponse.json(
        { success: false, error: "Link je istekao." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(novaLozinka, 10);

    await db.update(korisnik)
      .set({
        lozinka: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(korisnik.id, user.id));

    return NextResponse.json(
      { success: true, message: "Lozinka uspešno ažurirana!" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru." },
      { status: 500 }
    );
  }
};