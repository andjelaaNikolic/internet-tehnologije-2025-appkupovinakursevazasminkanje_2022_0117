import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kurs, korisnik, videoLekcija } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { csrf } from "@/lib/csrf";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/kursevi:
 *   get:
 *     summary: Vraća listu kurseva
 *     description: |
 *       Pravila pristupa:
 *       - GOST ili KLIJENT: Vraća sve dostupne kurseve.
 *       - EDUKATOR: Vraća samo kurseve koje je kreirao.
 *       - ADMIN: Pristup zabranjen.
 *     tags: [Kursevi]
 */
export async function GET() {
  try {
    let userRole: string | null = null;
    let userId: string | null = null;
    let token: string | undefined;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth")?.value;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga?: string };
        userRole = decoded.uloga || null;
        userId = decoded.sub;
      } catch {
        userRole = null;
        userId = null;
      }
    }

    if (userRole === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Administratori nemaju pristup ovoj ruti." },
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

    const rezultati =
      userRole === "EDUKATOR" && userId ? await query.where(eq(kurs.edukator, userId)) : await query;

    return NextResponse.json({ success: true, kursevi: rezultati, userRole, userId });
  } catch (error: any) {
    console.error("API /kursevi GET error:", error);
    return NextResponse.json({ success: false, error: "Greška pri učitavanju kurseva." }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/kursevi:
 *   post:
 *     summary: Kreiranje novog kursa
 *     description: Samo EDUKATOR može kreirati kurs sa lekcijama.
 *     tags: [Kursevi]
 *     security:
 *       - BearerAuth: []
 *       - CSRFToken: []
 */
export const POST = csrf(async function POST(req: Request) {
  try {
    // 🔑 Provera JWT tokena
    let token: string | undefined;
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth")?.value;
    }

    if (!token) return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });

    let edukatorId: string;
    let uloga: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
      edukatorId = decoded.sub;
      uloga = decoded.uloga;
    } catch {
      return NextResponse.json({ success: false, error: "Sesija nevažeća ili istekla." }, { status: 401 });
    }

    if (uloga !== "EDUKATOR") {
      return NextResponse.json(
        { success: false, error: "Pristup zabranjen. Samo edukatori mogu kreirati kurseve." },
        { status: 403 }
      );
    }

    const { naziv, opis, cena, kategorija, slika, lekcije } = await req.json();

    if (!naziv || !opis || !cena || !kategorija || !slika || !lekcije || lekcije.length === 0) {
      return NextResponse.json({ success: false, error: "Sva polja su obavezna." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // Kreiranje kursa
      const [noviKurs] = await tx.insert(kurs).values({
        naziv,
        opis,
        cena: cena.toString(),
        kategorija,
        slika,
        edukator: edukatorId,
      }).returning();

      // Kreiranje video lekcija
      const lekcijeZaBazu = lekcije.map((l: any, i: number) => ({
        naziv: l.naziv,
        opis: l.opis,
        trajanje: l.trajanje.toString(),
        video: l.video,
        kursId: noviKurs.id,
        poredak: i,
      }));

      await tx.insert(videoLekcija).values(lekcijeZaBazu);
    });

    return NextResponse.json({ success: true, message: "Kurs je uspešno kreiran." });
  } catch (error: any) {
    console.error("API /kursevi POST error:", error);
    return NextResponse.json({ success: false, error: "Greška pri čuvanju podataka." }, { status: 500 });
  }
});