"use server";

import { eq, asc, and, notInArray } from "drizzle-orm";
import { db } from "@/db/index";
import { kurs, videoLekcija } from "@/db/schema";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

export async function kreirajKompletanKurs(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;
    if (!token) return { success: false, error: "Niste ulogovani." };

    let edukatorId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      edukatorId = decoded.sub;
    } catch (err) {
      return { success: false, error: "Sesija je istekla. Ulogujte se ponovo." };
    }

    if (!data.naziv || !data.opis || !data.cena || !data.kategorija || !data.slika) {
      return { success: false, error: "Sva polja za kurs moraju biti popunjena." };
    }

    const cenaBroj = Number(data.cena);
    if (isNaN(cenaBroj) || cenaBroj < 0) {
      return { success: false, error: "Cena mora biti pozitivan broj." };
    }

    if (!data.lekcije || data.lekcije.length === 0) {
      return { success: false, error: "Morate dodati barem jednu lekciju." };
    }

    return await db.transaction(async (tx) => {
      const [noviKurs] = await tx.insert(kurs).values({
        naziv: data.naziv,
        opis: data.opis,
        cena: cenaBroj.toString(),
        kategorija: data.kategorija,
        slika: data.slika,
        edukator: edukatorId,
      }).returning();

      const lekcijeZaBazu = data.lekcije.map((l: any, index: number) => ({
        naziv: l.naziv,
        opis: l.opis,
        trajanje: l.trajanje.toString(),
        video: l.video,
        kursId: noviKurs.id,
        poredak: index,
      }));

      await tx.insert(videoLekcija).values(lekcijeZaBazu);

      return { success: true };
    });

  } catch (error: any) {
    console.error("Baza Error:", error);
    let poruka = "Greška pri čuvanju podataka.";
    if (error.code === '23505') poruka = "Kurs sa tim nazivom već postoji.";
    return { success: false, error: poruka };
  }
}

export async function getKurseviEdukatora() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) return [];

  let edukatorId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    edukatorId = decoded.sub;
  } catch {
    return [];
  }

  return await db
    .select({
      id: kurs.id,
      naziv: kurs.naziv,
      opis: kurs.opis,
      cena: kurs.cena,
      slika: kurs.slika,
      kategorija: kurs.kategorija
    })
    .from(kurs)
    .where(eq(kurs.edukator, edukatorId));
}

export async function getKursSaLekcijama(kursId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) throw new Error("Niste ulogovani");

  let edukatorId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    edukatorId = decoded.sub;
  } catch {
    throw new Error("Nevažeća sesija");
  }

  const [kursPodaci] = await db
    .select()
    .from(kurs)
    .where(eq(kurs.id, kursId));

  if (!kursPodaci || kursPodaci.edukator !== edukatorId) {
    throw new Error("Nemate pravo pristupa ovom kursu");
  }

  const lekcije = await db
    .select()
    .from(videoLekcija)
    .where(eq(videoLekcija.kursId, kursId))
    .orderBy(asc(videoLekcija.poredak));

  return {
    ...kursPodaci,
    lekcije,
  };
}

export async function izmeniKompletanKurs(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const kursId = data.id;
    if (!kursId) return { success: false, error: "Nedostaje ID kursa." };

    return await db.transaction(async (tx) => {
      await tx.update(kurs).set({
        naziv: data.naziv,
        opis: data.opis,
        cena: Number(data.cena).toString(),
        kategorija: data.kategorija,
        slika: data.slika,
      }).where(eq(kurs.id, kursId));

      const stigliIds = data.lekcije
        .filter((l: any) => l.id && l.id !== "")
        .map((l: any) => l.id);

      if (stigliIds.length > 0) {
        await tx.delete(videoLekcija).where(
          and(
            eq(videoLekcija.kursId, kursId),
            notInArray(videoLekcija.id, stigliIds)
          )
        );
      } else {
        await tx.delete(videoLekcija).where(eq(videoLekcija.kursId, kursId));
      }

      for (let i = 0; i < data.lekcije.length; i++) {
        const l = data.lekcije[i];
        if (l.id) {
          await tx.update(videoLekcija).set({
            naziv: l.naziv,
            opis: l.opis,
            trajanje: l.trajanje.toString(),
            video: l.video,
            poredak: i,
          }).where(eq(videoLekcija.id, l.id));
        } else {
          await tx.insert(videoLekcija).values({
            naziv: l.naziv,
            opis: l.opis,
            trajanje: l.trajanje.toString(),
            video: l.video,
            kursId,
            poredak: i,
          });
        }
      }
      return { success: true };
    });
  } catch (error: any) {
    console.error("IZMENA KURSA ERROR:", error);
    return { success: false, error: "Greška pri izmeni kursa." };
  }
}

export async function obrisiKurs(kursId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth")?.value;
    if (!token) return { success: false, error: "Niste ulogovani." };

    let edukatorId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      edukatorId = decoded.sub;
    } catch {
      return { success: false, error: "Sesija nevažeća." };
    }

    const [provera] = await db
      .select()
      .from(kurs)
      .where(eq(kurs.id, kursId));

    if (!provera || provera.edukator !== edukatorId) {
      return { success: false, error: "Nemate pravo da obrišete ovaj kurs." };
    }

    return await db.transaction(async (tx) => {
      await tx.delete(videoLekcija).where(eq(videoLekcija.kursId, kursId));
      await tx.delete(kurs).where(eq(kurs.id, kursId));
      return { success: true };
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return { success: false, error: "Došlo je do greške pri brisanju iz baze." };
  }
}