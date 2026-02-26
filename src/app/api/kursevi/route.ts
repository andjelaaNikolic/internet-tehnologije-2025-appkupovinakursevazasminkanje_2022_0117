/*
import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kurs, videoLekcija } from "@/db/schema";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

export const POST = async function POST(req: Request) {
  try {
    // 🔑 JWT autentifikacija
    const headersList = await headers();
    let token: string | undefined;
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);
    if (!token) token = (await cookies()).get("auth")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Niste ulogovani." },
        { status: 401 }
      );
    }

    let edukatorId: string;
    let uloga: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
      edukatorId = decoded.sub;
      uloga = decoded.uloga;
    } catch (err) {
      console.error("JWT error:", err);
      return NextResponse.json(
        { success: false, error: "Sesija nevažeća ili istekla." },
        { status: 401 }
      );
    }

    if (uloga !== "EDUKATOR") {
      return NextResponse.json(
        {
          success: false,
          error: "Pristup zabranjen. Samo edukatori mogu kreirati kurseve.",
        },
        { status: 403 }
      );
    }

    // 🔑 Podaci iz zahteva
    const { naziv, opis, cena, kategorija, slika, lekcije } = await req.json();

    if (
      !naziv?.trim() ||
      !opis?.trim() ||
      !cena ||
      !kategorija?.trim() ||
      !slika?.trim() ||
      !lekcije ||
      !Array.isArray(lekcije) ||
      lekcije.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Sva polja su obavezna i lekcije ne smeju biti prazne." },
        { status: 400 }
      );
    }

    console.log("Payload za kurs:", { naziv, opis, cena, kategorija, slika, lekcije, edukatorId });

    // 🔑 Kreiranje kursa i lekcija u transakciji
    const noviKurs = await db.transaction(async (tx) => {
      const [kursInsert] = await tx.insert(kurs).values({
        naziv: naziv.trim(),
        opis: opis.trim(),
        cena: Number(cena).toString(), // Drizzle numeric → string
        kategorija: kategorija.trim(),
        slika: slika.trim(),
        edukator: edukatorId, // TAČNO ime property-a iz pgTable
      }).returning();

      const lekcijeZaBazu = lekcije.map((l: any, i: number) => ({
        naziv: l.naziv.trim(),
        opis: l.opis.trim(),
        trajanje: Number(l.trajanje).toString(), // numeric → string
        video: l.video.trim(),
        kursId: kursInsert.id, // TAČNO ime property-a iz pgTable
        poredak: i,
      }));

      console.log("Lekcije za insert:", lekcijeZaBazu);

      await tx.insert(videoLekcija).values(lekcijeZaBazu);

      return kursInsert;
    });

    return NextResponse.json({
      success: true,
      message: "Kurs je uspešno kreiran.",
      data: noviKurs,
    });
  } catch (error: any) {
    console.error("API /kursevi POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Greška pri čuvanju podataka." },
      { status: 500 }
    );
  }
};

// Opcionalno možeš dodati GET handler za sve kurseve
export const GET = async function GET() {
  try {
    const sviKursevi = await db.select().from(kurs);
    return NextResponse.json({ success: true, data: sviKursevi });
  } catch (error: any) {
    console.error("API /kursevi GET error:", error);
    return NextResponse.json(
      { success: false, error: "Greška pri dobavljanju kurseva." },
      { status: 500 }
    );
  }
};
*/
// app/api/kursevi/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { kurs, videoLekcija, kupljeniKursevi, napredak } from "@/db/schema";
import { eq, inArray, asc, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "super_tajni_string_123";

// 🔑 Centralizovana JWT autentifikacija
async function getAuth() {
  try {
    let token: string | undefined;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth")?.value;
    }

    if (!token) return null;

    return jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
  } catch {
    return null;
  }
}

// ===================== GET: svi kursevi ili kurs sa lekcijama =====================
export async function GET(request: Request, { params }: { params?: { id?: string } }) {
  try {
    const auth = await getAuth();
    const kursId = params?.id;

    if (kursId) {
      // GET kurs po ID
      const [kursPodaci] = await db.select().from(kurs).where(eq(kurs.id, kursId));
      if (!kursPodaci)
        return NextResponse.json({ success: false, error: "Kurs nije pronađen." }, { status: 404 });

      let imaPristupSadrzaju = false;

      if (auth) {
        const jeVlasnik = String(kursPodaci.edukator) === String(auth.sub);

        const [kupovina] = await db
          .select()
          .from(kupljeniKursevi)
          .where(
            and(
              eq(kupljeniKursevi.kursId, kursId),
              eq(kupljeniKursevi.korisnikId, auth.sub)
            )
          )
          .limit(1);

        if (jeVlasnik || kupovina) imaPristupSadrzaju = true;
      }

      const sveLekcije = await db
        .select()
        .from(videoLekcija)
        .where(eq(videoLekcija.kursId, kursId))
        .orderBy(asc(videoLekcija.poredak));

      const filtriraneLekcije = sveLekcije.map((l) => {
        if (imaPristupSadrzaju) return l;
        const { video, ...javniPodaci } = l;
        return javniPodaci;
      });

      return NextResponse.json({
        success: true,
        kurs: { ...kursPodaci, lekcije: filtriraneLekcije, jeKupljen: imaPristupSadrzaju },
      });
    } else {
      // GET svi kursevi
      const sviKursevi = await db.select().from(kurs);
      return NextResponse.json({ success: true, kursevi: sviKursevi, userRole: auth?.uloga, userId: auth?.sub });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ===================== POST: kreiranje kursa =====================
export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.uloga !== "EDUKATOR")
      return NextResponse.json(
        { success: false, error: "Pristup zabranjen. Samo edukatori mogu kreirati kurseve." },
        { status: 403 }
      );

    const { naziv, opis, cena, kategorija, slika, lekcije } = await request.json();

    if (!naziv || !opis || !cena || !kategorija || !slika || !lekcije?.length)
      return NextResponse.json({ success: false, error: "Sva polja su obavezna." }, { status: 400 });

    const noviKurs = await db.transaction(async (tx) => {
      const [kursInsert] = await tx.insert(kurs).values({
        naziv,
        opis,
        cena: String(cena),
        kategorija,
        slika,
        edukator: auth.sub,
      }).returning();

      const lekcijeZaBazu = lekcije.map((l: any, i: number) => ({
        naziv: l.naziv,
        opis: l.opis,
        trajanje: String(l.trajanje),
        video: l.video,
        kursId: kursInsert.id,
        poredak: i,
      }));

      await tx.insert(videoLekcija).values(lekcijeZaBazu);

      return kursInsert;
    });

    return NextResponse.json({ success: true, message: "Kurs je uspešno kreiran.", data: noviKurs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Greška pri čuvanju." }, { status: 500 });
  }
}

// ===================== PATCH: izmena kursa =====================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: kursId } = params;
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });

    const body = await request.json();
    const { naziv, opis, cena, kategorija, slika, lekcije } = body;

    const [postojeciKurs] = await db.select().from(kurs).where(eq(kurs.id, kursId));
    if (!postojeciKurs) return NextResponse.json({ success: false, error: "Kurs ne postoji" }, { status: 404 });
    if (String(postojeciKurs.edukator) !== String(auth.sub))
      return NextResponse.json({ success: false, error: "Niste vlasnik kursa" }, { status: 403 });

    await db.transaction(async (tx) => {
      await tx.update(kurs).set({ naziv, opis, cena: String(cena), kategorija, slika }).where(eq(kurs.id, kursId));

      if (lekcije?.length) {
        for (let i = 0; i < lekcije.length; i++) {
          const l = lekcije[i];
          if (l.id) {
            await tx.update(videoLekcija).set({
              naziv: l.naziv,
              opis: l.opis,
              trajanje: String(l.trajanje),
              video: l.video,
              poredak: i,
            }).where(eq(videoLekcija.id, l.id));
          } else {
            await tx.insert(videoLekcija).values({
              naziv: l.naziv,
              opis: l.opis,
              trajanje: String(l.trajanje),
              video: l.video,
              kursId,
              poredak: i,
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ===================== DELETE: brisanje kursa =====================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: kursId } = params;
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });

    const [postojeciKurs] = await db.select().from(kurs).where(eq(kurs.id, kursId));
    if (!postojeciKurs) return NextResponse.json({ success: false, error: "Kurs ne postoji" }, { status: 404 });
    if (String(postojeciKurs.edukator) !== String(auth.sub))
      return NextResponse.json({ success: false, error: "Niste vlasnik kursa" }, { status: 403 });

    const prodaje = await db.select().from(kupljeniKursevi).where(eq(kupljeniKursevi.kursId, kursId)).limit(1);
    if (prodaje.length) return NextResponse.json({ success: false, error: "Ne može se obrisati kurs koji je kupljen" }, { status: 400 });

    await db.transaction(async (tx) => {
      const lekcije = await tx.select({ id: videoLekcija.id }).from(videoLekcija).where(eq(videoLekcija.kursId, kursId));
      const lekcijaIds = lekcije.map((l) => l.id);

      if (lekcijaIds.length) {
        await tx.delete(napredak).where(inArray(napredak.videoLekcijaId, lekcijaIds));
        await tx.delete(videoLekcija).where(eq(videoLekcija.kursId, kursId));
      }

      await tx.delete(kurs).where(eq(kurs.id, kursId));
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}