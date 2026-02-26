// src/app/api/kursevi/route.ts
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
      return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });
    }

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

    // 🔑 Podaci iz zahteva
    const { naziv, opis, cena, kategorija, slika, lekcije } = await req.json();
    if (!naziv || !opis || !cena || !kategorija || !slika || !lekcije || lekcije.length === 0) {
      return NextResponse.json({ success: false, error: "Sva polja su obavezna." }, { status: 400 });
    }

    // 🔑 Kreiranje kursa i lekcija u transakciji
    await db.transaction(async (tx) => {
      const [noviKurs] = await tx.insert(kurs).values({
        naziv,
        opis,
        cena: cena.toString(),
        kategorija,
        slika,
        edukator: edukatorId,
      }).returning();

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
    return NextResponse.json(
      { success: false, error: "Greška pri čuvanju podataka." },
      { status: 500 }
    );
  }
};