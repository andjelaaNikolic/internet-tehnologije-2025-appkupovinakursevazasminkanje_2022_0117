import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kupljeniKursevi, kurs, korisnik } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/edukator/prodaja:
 *   get:
 *     summary: Detaljan pregled prodaje po kursevima
 *     description: Vraća listu svih kurseva ulogovanog edukatora sa spiskom klijenata koji su ih kupili. DOZVOLJENO SAMO ZA EDUKATORE.
 *     tags: [Edukator]
 *     security:              
 *       - BearerAuth: []      
 *     responses:
 *       200:
 *         description: Uspešno dobavljeni podaci o prodaji.
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
 *                       kursId:
 *                         type: string
 *                       naziv:
 *                         type: string
 *                       klijenti:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             klijentIme:
 *                               type: string
 *                             klijentPrezime:
 *                               type: string
 *                             klijentEmail:
 *                               type: string
 *                             datumKupovine:
 *                               type: string
 *                               format: date-time
 *                             metodPlacanja:
 *                               type: string
 *                             statusPlacanja:
 *                               type: string
 *       401:
 *         description: Niste ulogovani ili je sesija nevažeća.
 *       403:
 *         description: Zabranjen pristup. Korisnik nema ulogu EDUKATOR.
 *       500:
 *         description: Greška na serveru prilikom obrade podataka.
 */
export async function GET() {
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

    let edukatorId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string, uloga: string };
      if (decoded.uloga !== "EDUKATOR" && decoded.uloga !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Nemate pravo pristupa." }, { status: 403 });
      }
      edukatorId = decoded.sub;
    } catch (err) {
      return NextResponse.json({ success: false, error: "Sesija nevažeća." }, { status: 401 });
    }

    const rezultati = await db
      .select({
        kursId: kurs.id,
        naziv: kurs.naziv,
        klijentIme: korisnik.ime,
        klijentPrezime: korisnik.prezime,
        klijentEmail: korisnik.email,
        datumKupovine: kupljeniKursevi.datum,
        metodPlacanja: kupljeniKursevi.metodPlacanja,
        statusPlacanja: kupljeniKursevi.statusPlacanja,
      })
      .from(kurs)
      .leftJoin(kupljeniKursevi, eq(kurs.id, kupljeniKursevi.kursId))
      .leftJoin(korisnik, eq(kupljeniKursevi.korisnikId, korisnik.id))
      .where(eq(kurs.edukator, edukatorId))
      .orderBy(desc(kupljeniKursevi.datum));

    const kurseviSaKlijentima = rezultati.reduce((acc: any[], curr) => {
      let kursObj = acc.find((item) => item.kursId === curr.kursId);

      if (!kursObj) {
        kursObj = { kursId: curr.kursId, naziv: curr.naziv, klijenti: [] };
        acc.push(kursObj);
      }

      if (curr.klijentEmail) {
        kursObj.klijenti.push({
          klijentIme: curr.klijentIme,
          klijentPrezime: curr.klijentPrezime,
          klijentEmail: curr.klijentEmail,
          datumKupovine: curr.datumKupovine,
          metodPlacanja: curr.metodPlacanja,
          statusPlacanja: curr.statusPlacanja,
        });
      }
      return acc;
    }, []);

    return NextResponse.json({ success: true, data: kurseviSaKlijentima });

  } catch (error: any) {
    console.error("Greška na serveru (GET /api/edukator/prodaja):", error);
    return NextResponse.json(
      { success: false, error: "Sistem trenutno ne može da učita izveštaj o prodaji." },
      { status: 500 }
    );
  }
}