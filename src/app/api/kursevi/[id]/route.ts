import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { kurs, videoLekcija, kupljeniKursevi, napredak } from '@/db/schema';
import { eq, inArray, asc, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { csrf } from '@/lib/csrf';

const JWT_SECRET = process.env.JWT_SECRET || 'super_tajni_string_123';

async function getAuth() {
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

    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { sub: string, uloga: string };
  } catch (e) {
    return null;
  }
}

/**
 * @swagger
 * /api/kursevi/{id}:
 *   get:
 *     summary: Dobavljanje detalja o određenom kursu
 *     description: Vraća podatke o kursu. Video linkovi lekcija su vidljivi samo vlasniku kursa ili kupcu.
 *     tags: [Kursevi]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID kursa
 *     responses:
 *       200:
 *         description: Uspešno vraćeni podaci o kursu.
 *       403:
 *         description: Pristup zabranjen za ADMIN ulogu.
 *       404:
 *         description: Kurs nije pronađen.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kursId } = await params;
    const auth = await getAuth();

    if (auth?.uloga === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admini nemaju pristup detaljima kurseva.' }, { status: 403 });
    }

    const [kursPodaci] = await db.select().from(kurs).where(eq(kurs.id, kursId));
    if (!kursPodaci) return NextResponse.json({ success: false, error: 'Kurs nije pronađen.' }, { status: 404 });

    let imaPristupSadrzaju = false;

    if (auth) {
      const jeVlasnik = String(kursPodaci.edukator) === String(auth.sub);

      const [kupovina] = await db
        .select()
        .from(kupljeniKursevi)
        .where(and(
          eq(kupljeniKursevi.kursId, kursId),
          eq(kupljeniKursevi.korisnikId, auth.sub)
        ))
        .limit(1);

      if (jeVlasnik || kupovina) {
        imaPristupSadrzaju = true;
      }
    }

    const sveLekcije = await db
      .select()
      .from(videoLekcija)
      .where(eq(videoLekcija.kursId, kursId))
      .orderBy(asc(videoLekcija.poredak));

    const filtriraneLekcije = sveLekcije.map(l => {
      if (imaPristupSadrzaju) {
        return l;
      }
      const { video, ...javniPodaci } = l;
      return javniPodaci;
    });

    return NextResponse.json({
      success: true,
      kurs: {
        ...kursPodaci,
        lekcije: filtriraneLekcije,
        jeKupljen: imaPristupSadrzaju
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/kursevi/{id}:
 *   patch:
 *     summary: Ažuriranje postojećeg kursa i lekcija
 *     description: Dozvoljava EDUKATORU da izmeni osnovne podatke o kursu i lekcije.
 *     tags: [Kursevi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               naziv: { type: string }
 *               opis: { type: string }
 *               cena: { type: number }
 *               kategorija: { type: string }
 *               slika: { type: string }
 *               lekcije:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     naziv: { type: string }
 *                     opis: { type: string }
 *                     trajanje: { type: string }
 *                     video: { type: string }
 *     responses:
 *       200:
 *         description: Kurs uspešno ažuriran.
 *       401:
 *         description: Niste ulogovani.
 *       403:
 *         description: Nemate dozvolu, jer niste vlasnik kursa.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "CSRF zaštita: nevalidan token" }, { status: 403 });
    }
  }

  try {
    const { id: kursId } = await params;
    const body = await request.json();
    const { naziv, opis, cena, kategorija, slika, lekcije } = body;

    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: 'Niste ulogovani ili nevažeći token' }, { status: 401 });

    const [postojeciKurs] = await db.select().from(kurs).where(eq(kurs.id, kursId));
    if (!postojeciKurs) return NextResponse.json({ error: 'Kurs ne postoji' }, { status: 404 });

    if (String(postojeciKurs.edukator) !== String(auth.sub)) {
      return NextResponse.json({ error: 'Zabranjen pristup - niste vlasnik kursa' }, { status: 403 });
    }

    await db.transaction(async (tx) => {
      await tx.update(kurs).set({
        naziv, opis, cena: cena.toString(), kategorija, slika
      }).where(eq(kurs.id, kursId));

      if (lekcije && lekcije.length > 0) {
        for (let i = 0; i < lekcije.length; i++) {
          const l = lekcije[i];
          if (l.id) {
            await tx.update(videoLekcija)
              .set({ naziv: l.naziv, opis: l.opis, trajanje: l.trajanje.toString(), video: l.video, poredak: i })
              .where(eq(videoLekcija.id, l.id));
          } else {
            await tx.insert(videoLekcija).values({
              naziv: l.naziv, opis: l.opis, trajanje: l.trajanje.toString(), video: l.video, kursId: kursId, poredak: i
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

/**
 * @swagger
 * /api/kursevi/{id}:
 *   delete:
 *     summary: Brisanje kursa
 *     description: Briše kurs ako nema prodaja. Zahteva vlasništvo nad kursom.
 *     tags: [Kursevi]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kurs uspešno obrisan.
 *       400:
 *         description: Nije moguće obrisati prodat kurs.
 *       403:
 *         description: Zabranjen pristup.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "CSRF zaštita" }, { status: 403 });
    }
  }

  try {
    const { id: kursId } = await params;
    const auth = await getAuth();

    if (!auth) return NextResponse.json({ success: false, error: 'Niste ulogovani.' }, { status: 401 });

    const [provera] = await db.select().from(kurs).where(eq(kurs.id, kursId));
    if (!provera) return NextResponse.json({ success: false, error: 'Kurs ne postoji.' }, { status: 404 });

    if (String(provera.edukator) !== String(auth.sub)) {
      return NextResponse.json({ success: false, error: 'Nemate dozvolu.' }, { status: 403 });
    }

    const prodaje = await db.select().from(kupljeniKursevi).where(eq(kupljeniKursevi.kursId, kursId)).limit(1);
    if (prodaje.length > 0) {
      return NextResponse.json({ success: false, error: 'Nije moguće obrisati kurs koji klijenti već koriste!' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      const lekcije = await tx.select({ id: videoLekcija.id }).from(videoLekcija).where(eq(videoLekcija.kursId, kursId));
      const lekcijaIds = lekcije.map(l => l.id);

      if (lekcijaIds.length > 0) {
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