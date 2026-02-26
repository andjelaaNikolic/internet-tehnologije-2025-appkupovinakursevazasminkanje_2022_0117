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
import { kurs } from "@/db/schema";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "super_tajni_string_123";

async function getAuth() {
  try {
    let token: string | undefined;
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);
    if (!token) token = (await cookies()).get("auth")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };
  } catch {
    return null;
  }
}

// GET: svi kursevi
export async function GET() {
  const auth = await getAuth();
  const sviKursevi = await db.select().from(kurs);
  return NextResponse.json({ success: true, kursevi: sviKursevi, userRole: auth?.uloga, userId: auth?.sub });
}

// POST: kreiranje kursa
export async function POST(request: Request) {
  const auth = await getAuth();
  if (!auth || auth.uloga !== "EDUKATOR")
    return NextResponse.json({ success: false, error: "Samo edukatori mogu kreirati kurseve." }, { status: 403 });

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
    return kursInsert;
  });

  return NextResponse.json({ success: true, message: "Kurs kreiran.", data: noviKurs });
}