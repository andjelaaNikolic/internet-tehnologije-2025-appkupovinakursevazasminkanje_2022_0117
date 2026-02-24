import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kupljeniKursevi, kurs, korisnik } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { verifyCsrfToken } from "@/lib/csrf";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/edukator/klijenti:
 *   get:
 *     summary: Lista klijenata za ulogovanog edukatora
 *     description: Vraća listu svih korisnika koji su kupili barem jedan kurs od edukatora koji je trenutno ulogovan. DOZVOLJENO SAMO ZA EDUKATORE.
 *     tags: [Edukator]
 *     security:               
 *       - BearerAuth: []      
 *     responses:
 *       200:
 *         description: Uspešno dobavljena lista klijenata.
 *       401:
 *         description: Niste ulogovani ili je sesija nevažeća.
 *       403:
 *         description: Zabranjen pristup. Korisnik nema ulogu EDUKATOR.
 *       500:
 *         description: Greška na serveru prilikom dobavljanja podataka.
 */
export const GET = async function GET() {
  try {
    // 🔑 CSRF token (opciono za GET, ali ako želiš, možeš dodati)
    const csrfToken = (await headers()).get("x-csrf-token");
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json(
        { success: false, error: "Nevažeći CSRF token." },
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: "Niste ulogovani." },
        { status: 401 }
      );
    }

    let edukatorId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };

      if (decoded.uloga !== "EDUKATOR" && decoded.uloga !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Nemate pravo pristupa." },
          { status: 403 }
        );
      }

      edukatorId = decoded.sub;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Sesija nevažeća ili je istekla." },
        { status: 401 }
      );
    }

    const klijenti = await db
      .select({
        korisnikId: kupljeniKursevi.korisnikId,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        email: korisnik.email,
        brojKurseva: sql<number>`COUNT(${kupljeniKursevi.kursId})`,
      })
      .from(kupljeniKursevi)
      .innerJoin(korisnik, eq(kupljeniKursevi.korisnikId, korisnik.id))
      .innerJoin(kurs, eq(kupljeniKursevi.kursId, kurs.id))
      .where(eq(kurs.edukator, edukatorId))
      .groupBy(kupljeniKursevi.korisnikId, korisnik.ime, korisnik.prezime, korisnik.email);

    return NextResponse.json({
      success: true,
      data: klijenti
    });

  } catch (error: any) {
    console.error('API /edukator/klijenti error:', error);
    return NextResponse.json(
      { success: false, error: 'Greška na serveru prilikom dobavljanja podataka.' },
      { status: 500 }
    );
  }
};