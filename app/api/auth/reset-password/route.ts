
import { NextResponse } from "next/server";
import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const body = await req.json();
    const { email, novaLozinka } = body;

    if (!email || !novaLozinka) {
      return NextResponse.json({ message: "Podaci su nepotpuni" }, { status: 400 });
    }

    await client.connect();

    // 1. Provera postojanja korisnika
    const checkQuery = 'SELECT * FROM korisnik WHERE email = $1';
    const checkRes = await client.query(checkQuery, [email]);
    
    if (checkRes.rows.length === 0) {
      await client.end();
      return NextResponse.json({ message: "Korisnik nije pronađen" }, { status: 404 });
    }

    // 2. KRIPTOVANJE LOZINKE (DODATO)
    // Generišemo salt i hešujemo lozinku pre upisa u bazu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaLozinka, salt);

    // 3. Ažuriranje sa hešovanom lozinkom
    const updateQuery = 'UPDATE korisnik SET lozinka = $1 WHERE email = $2';
    await client.query(updateQuery, [hashedPassword, email]);

    await client.end();
    return NextResponse.json({ message: "Lozinka uspešno ažurirana!" }, { status: 200 });

  } catch (error: any) {
    if (client) try { await client.end(); } catch (e) {}
    console.error("RESET PASSWORD ERROR:", error.message);
    return NextResponse.json(
      { message: "Greška pri bazi: " + error.message },
      { status: 500 }
    );
  }
}
