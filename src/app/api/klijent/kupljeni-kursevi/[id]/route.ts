import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoLekcija, kurs, napredak, kupljeniKursevi } from "@/db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/klijent/kupljeni-kursevi/{id}:
 *   get:
 *     summary: Detalji kupljenog kursa, lekcije i napredak 
 *     description: Vraća podatke o kursu samo ako je ulogovani klijent zaista kupio taj kurs. DOZVOLJENO SAMO ZA ULOGOVANE KORISNIKE.
 *     tags: [Kursevi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Jedinstveni ID kursa
 *     responses:
 *       200:
 *         description: Uspešno dobavljeni podaci.
 *       401:
 *         description: Niste ulogovani.
 *       403:
 *         description: Zabranjen pristup, jer kurs nije kupljen.
 *       404:
 *         description: Kurs nije pronađen.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kursId } = await params;

    if (!kursId) {
      return NextResponse.json({ success: false, error: "Nedostaje ID kursa." }, { status: 400 });
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

    let korisnikId = "";
    try {
      if (!token) throw new Error("Token nedostaje");
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      korisnikId = decoded.sub;
    } catch (e) {
      return NextResponse.json({ success: false, error: "Niste ulogovani ili je sesija nevažeća." }, { status: 401 });
    }

    const [proveraKupovine] = await db
      .select()
      .from(kupljeniKursevi)
      .where(
        and(
          eq(kupljeniKursevi.korisnikId, korisnikId),
          eq(kupljeniKursevi.kursId, kursId)
        )
      )
      .limit(1);

    if (!proveraKupovine) {
      return NextResponse.json({
        success: false,
        error: "Zabranjen pristup. Niste kupili ovaj kurs."
      }, { status: 403 });
    }

    const kursPodaci = await db.query.kurs.findFirst({
      where: eq(kurs.id, kursId)
    });

    if (!kursPodaci) {
      return NextResponse.json({ success: false, error: "Kurs nije pronađen u bazi." }, { status: 404 });
    }

    const lekcije = await db
      .select()
      .from(videoLekcija)
      .where(eq(videoLekcija.kursId, kursId))
      .orderBy(asc(videoLekcija.poredak));

    let inicijalniNapredak: string[] = [];
    if (lekcije.length > 0) {
      const lekcijeIds = lekcije.map(l => l.id);
      const odgledano = await db
        .select()
        .from(napredak)
        .where(
          and(
            eq(napredak.korisnikId, korisnikId),
            inArray(napredak.videoLekcijaId, lekcijeIds),
            eq(napredak.odgledano, true)
          )
        );
      inicijalniNapredak = odgledano.map(n => n.videoLekcijaId);
    }

    return NextResponse.json({
      success: true,
      kurs: kursPodaci,
      lekcije,
      inicijalniNapredak
    });

  } catch (error: any) {
    console.error('API /klijent/kupljeni-kursevi/[id] GET error:', error);
    return NextResponse.json({ success: false, error: "Interna greška na serveru." }, { status: 500 });
  }
}