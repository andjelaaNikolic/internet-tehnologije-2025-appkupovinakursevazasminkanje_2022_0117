
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Client } from "pg";

/**
 * VAŽNO ZA GMAIL:
 * 1. Uključi 2-Step Verification na insensitivo.makeup@gmail.com
 * 2. Napravi "App Password" na: https://myaccount.google.com/apppasswords
 * 3. Kopiraj 16-slovni kod i zalepi ga u GMAIL_APP_PASSWORD ili direktno u 'pass'.
 */

export async function POST(req: Request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email je obavezan" }, { status: 400 });
    }

    await client.connect();

    // 1. Provera da li korisnik postoji u tabeli 'korisnik'
    const query = 'SELECT * FROM korisnik WHERE email = $1';
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { message: "Greška: Korisnik sa ovim emailom ne postoji u našoj bazi." },
        { status: 404 }
      );
    }

    // 2. Konfiguracija za Gmail slanje
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "insensitivo.makeup@gmail.com",
        // OBAVEZNO KORISTITI APP PASSWORD (16 SLOVA)
        pass: process.env.GMAIL_APP_PASSWORD || "nelu spho gnzj fvom", 
      },
    });

    const resetLink = `http://localhost:3000/reset-password?email=${email}`;

    // 3. Slanje mejla
    await transporter.sendMail({
      from: '"Makeup Studio" <insensitivo.makeup@gmail.com>',
      to: email,
      subject: "Promena lozinke",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; background-color: #fdfaf8; padding: 40px; border-radius: 15px;">
          <h2 style="color: #AD8B73;">Makeup Studio</h2>
          <p>Primili smo zahtev za promenu lozinke za vaš nalog.</p>
          <p>Kliknite na dugme ispod da biste postavili novu lozinku:</p>
          <br>
          <a href="${resetLink}" style="background-color: #AD8B73; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            POSTAVI NOVU LOZINKU
          </a>
          <br><br>
          <p style="color: #999; font-size: 12px;">Ako niste tražili promenu, ignorišite ovaj mejl.</p>
        </div>
      `,
    });

    await client.end();
    return NextResponse.json({ message: "Email uspešno poslat!" }, { status: 200 });

  } catch (error: any) {
    if (client) try { await client.end(); } catch (e) {}
    
    console.error("DETALJNA GREŠKA:", error.message);

    // Ako dobiješ 535, to je 100% pogrešna lozinka (treba App Password)
    if (error.message.includes("535") || error.message.includes("Invalid login")) {
      return NextResponse.json(
        { message: "Gmail odbija pristup. Moraš uključiti 2-Step Verification i koristiti App Password (16 slova)." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Greška na serveru: " + error.message },
      { status: 500 }
    );
  }
}
