import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { kurs, korisnik, videoLekcija } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';  
import { csrf } from '@/lib/csrf';

const JWT_SECRET = process.env.JWT_SECRET || 'tvoja_tajna_sifra_123';

/**
 * @swagger
 * /api/kursevi:
 *   get:
 *     summary: Vraća listu kurseva
 *     description: |
 *       Pravila pristupa:
 *       - GOST ili KLIJENT: Vraća SVE dostupne kurseve u bazi.
 *       - EDUKATOR: Vraća samo kurseve čiji je on autor (vlasnik).
 *       - ADMIN: Pristup zabranjen (403). Admin nema pristup pregledu kurseva na ovoj ruti.
 *     tags: [Kursevi]
 *     responses:
 *       200:
 *         description: Uspešno vraćeni podaci o kursevima.
 *       403:
 *         description: Pristup zabranjen za ulogu ADMIN.
 *       500:
 *         description: Greška na serveru prilikom dobavljanja podataka.
 */
export async function GET() {
  try {
    let userRole: string | null = null;
    let userId: string | null = null;
    let token: string | undefined;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth')?.value;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga?: string };
        userRole = decoded.uloga || null;
        userId = decoded.sub;
      } catch (e) {
      }
    }

    if (userRole === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Administratori nemaju pravo pristupa listi kurseva na ovoj ruti.' }, 
        { status: 403 }
      );
    }

    let query = db
      .select({
        id: kurs.id,
        naziv: kurs.naziv,
        opis: kurs.opis,
        cena: kurs.cena,
        slika: kurs.slika,
        kategorija: kurs.kategorija,
        edukatorIme: korisnik.ime,
        edukatorPrezime: korisnik.prezime,
        edukatorId: kurs.edukator,
      })
      .from(kurs)
      .leftJoin(korisnik, eq(kurs.edukator, korisnik.id));

    let rezultati;

    if (userRole === 'EDUKATOR' && userId) {
      rezultati = await query.where(eq(kurs.edukator, userId));
    } else {
      rezultati = await query;
    }

    return NextResponse.json({ 
      success: true, 
      kursevi: rezultati, 
      userRole, 
      userId 
    });

  } catch (error: any) {
    console.error('API /kursevi GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju kurseva.' }, 
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/kursevi:
 *   post:
 *     summary: Kreiranje novog kursa
 *     description: Dozvoljeno samo korisnicima sa ulogom EDUKATOR. Potrebno je poslati podatke o kursu i listu video lekcija.
 *     tags: [Kursevi]
 *     security:
 *       - BearerAuth: []
 *       - CSRFToken: []
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
 *             required: [naziv, opis, cena, kategorija, slika, lekcije]
 *             properties:
 *               naziv: { type: string, example: "Kurs šminkanja za početnike" }
 *               opis: { type: string, example: "Detaljan opis kursa..." }
 *               cena: { type: number, example: 49.99 }
 *               kategorija: { type: string, example: "Osnove" }
 *               slika: { type: string, example: "https://putanja-do-slike.jpg" }
 *               lekcije:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     naziv: { type: string }
 *                     opis: { type: string }
 *                     trajanje: { type: string }
 *                     video: { type: string }
 *     responses:
 *       200:
 *         description: Kurs i lekcije su uspešno kreirani u bazi.
 *       401:
 *         description: Niste ulogovani (Nedostaje validan token).
 *       403:
 *         description: Zabranjen pristup (Uloga nije EDUKATOR) ili CSRF token nije validan.
 *       500:
 *         description: Greška na serveru prilikom čuvanja u bazu.
 */
export const POST = csrf(async function POST(request: Request) {
  try {
    let token: string | undefined;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth')?.value;
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Niste ulogovani.' }, { status: 401 });
    }

    let edukatorId: string;
    let uloga: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
      edukatorId = decoded.sub;
      uloga = decoded.uloga;
    } catch {
      return NextResponse.json({ success: false, error: 'Sesija nevažeća ili istekla.' }, { status: 401 });
    }

    if (uloga !== 'EDUKATOR') {
      return NextResponse.json(
        { success: false, error: 'Pristup zabranjen. Samo edukatori mogu kreirati kurseve.' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { naziv, opis, cena, kategorija, slika, lekcije } = body;

    if (!naziv || !opis || !cena || !kategorija || !slika || !lekcije || lekcije.length === 0) {
      return NextResponse.json({ success: false, error: 'Sva polja su obavezna.' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      const [noviKurs] = await tx.insert(kurs).values({
        naziv,
        opis,
        cena: cena.toString(),
        kategorija,
        slika,
        edukator: edukatorId,
      }).returning();

      const lekcijeZaBazu = lekcije.map((l: any, index: number) => ({
        naziv: l.naziv,
        opis: l.opis,
        trajanje: l.trajanje.toString(),
        video: l.video,
        kursId: noviKurs.id,
        poredak: index,
      }));

      await tx.insert(videoLekcija).values(lekcijeZaBazu);
    });

    return NextResponse.json({ success: true, message: "Kurs je uspešno kreiran." });

  } catch (error: any) {
    console.error('API /kursevi POST error:', error);
    return NextResponse.json({ success: false, error: 'Greška pri čuvanju podataka.' }, { status: 500 });
  }
});