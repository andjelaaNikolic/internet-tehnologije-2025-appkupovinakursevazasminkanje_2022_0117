import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kupljeniKursevi, kurs, korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/klijent/kupljeni-kursevi:
 *   get:
 *     summary: Lista kupljenih kurseva ulogovanog korisnika
 *     description: Vraća listu svih kurseva koje je trenutno ulogovani klijent kupio. DOZVOLJENO SAMO ZA ULOGOVANE KORISNIKE.
 *     tags: [Kursevi]
 *     security:               
 *       - BearerAuth: []      
 *     responses:
 *       200:
 *         description: Uspešno dobavljena lista kupljenih kurseva.
 *       401:
 *         description: Niste ulogovani ili je sesija nevažeća.
 *       403:
 *         description: Zabranjen pristup (Pristup dozvoljen samo klijentima).
 *       500:
 *         description: Greška na serveru prilikom dobavljanja podataka.
 */
export const GET = async function GET() {
  try {
    // 🔑 Preuzimanje JWT tokena iz header-a ili kolačića
    const headersList = await headers();
    let token = headersList.get("authorization")?.startsWith("Bearer ")
      ? headersList.get("authorization")!.substring(7)
      : undefined;

    if (!token) token = (await cookies()).get("auth")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Niste ulogovani." },
        { status: 401 }
      );
    }

    // 🔒 Dekodiranje tokena i provera uloge
    let korisnikId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
      if (decoded.uloga !== "KLIJENT" && decoded.uloga !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Nemate pravo pristupa." },
          { status: 403 }
        );
      }
      korisnikId = decoded.sub;
    } catch {
      return NextResponse.json(
        { success: false, error: "Sesija nevažeća ili je istekla." },
        { status: 401 }
      );
    }

    // 📚 Dohvatanje kupljenih kurseva korisnika
    const mojiKursevi = await db
      .select({
        id: kurs.id,
        naziv: kurs.naziv,
        opis: kurs.opis,
        slika: kurs.slika,
        kategorija: kurs.kategorija,
        edukatorIme: korisnik.ime,
        edukatorPrezime: korisnik.prezime,
      })
      .from(kupljeniKursevi)
      .innerJoin(kurs, eq(kupljeniKursevi.kursId, kurs.id))
      .innerJoin(korisnik, eq(kurs.edukator, korisnik.id))
      .where(eq(kupljeniKursevi.korisnikId, korisnikId));

    return NextResponse.json({ success: true, data: mojiKursevi });

  } catch (error: any) {
    console.error("API /klijent/kupljeni-kursevi error:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru prilikom dobavljanja podataka." },
      { status: 500 }
    );
  }
};