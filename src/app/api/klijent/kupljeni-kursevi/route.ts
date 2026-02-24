import { NextResponse } from "next/server";
import { csrf } from '@/lib/csrf';
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       naziv:
 *                         type: string
 *                       opis:
 *                         type: string
 *                       slika:
 *                         type: string
 *                       kategorija:
 *                         type: string
 *                       edukatorIme:
 *                         type: string
 *                       edukatorPrezime:
 *                         type: string
 *       401:
 *         description: Niste ulogovani ili je sesija nevažeća.
 *       403:
 *         description: Zabranjen pristup (Pristup dozvoljen samo klijentima).
 *       500:
 *         description: Greška na serveru prilikom dobavljanja podataka.
 */
export const GET = csrf(async function GET(req: Request) {
  try {
    let token: string | undefined;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth")?.value;
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });
    }

    let korisnikId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string, uloga: string };
      korisnikId = decoded.sub;



    } catch (err) {
      return NextResponse.json({ success: false, error: "Sesija nevažeća ili je istekla." }, { status: 401 });
    }

    const mojiKursevi = await db
      .select({
        id: kurs.id,
        naziv: kurs.naziv,
        opis: kurs.opis,
        slika: kurs.slika,
        kategorija: kurs.kategorija,
        edukatorIme: korisnik.ime,
        edukatorPrezime: korisnik.prezime
      })
      .from(kupljeniKursevi)
      .innerJoin(kurs, eq(kupljeniKursevi.kursId, kurs.id))
      .innerJoin(korisnik, eq(kurs.edukator, korisnik.id))
      .where(eq(kupljeniKursevi.korisnikId, korisnikId));

    return NextResponse.json({
      success: true,
      data: mojiKursevi
    });

  } catch (error: any) {
    console.error("Greška API /klijent/kupljeni-kursevi:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru prilikom dobavljanja podataka." },
      { status: 500 }
    );
  }
});