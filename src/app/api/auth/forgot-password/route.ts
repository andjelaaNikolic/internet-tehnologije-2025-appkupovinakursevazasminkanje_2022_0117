import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
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
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email je obavezan." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(korisnik)
      .where(eq(korisnik.email, email))
      .limit(1);

    // 🔒 Ne otkrivamo da li korisnik postoji
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "Ako nalog postoji, instrukcije su poslate na email.",
        },
        { status: 200 }
      );
    }

    // 🔑 Generisanje reset tokena
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 sat

    await db
      .update(korisnik)
      .set({ resetToken, resetTokenExpiry: expiry })
      .where(eq(korisnik.id, user.id));

    // ❗ NIKAD ne hardkoduj kredencijale
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL kredencijali nisu podešeni.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const resetLink = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Insensitivo Makeup" <${process.env.GMAIL_USER}>`,
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
          <p style="color: #999; font-size: 12px;">
            Ako niste tražili promenu, ignorišite ovaj mejl.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Email uspešno poslat!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru." },
      { status: 500 }
    );
  }
};