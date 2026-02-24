import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { kurs } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { csrf } from '@/lib/csrf';

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/klijent/checkout:
 *   post:
 *     summary: Kreiranje Stripe Checkout sesije
 *     description: Inicijalizuje proces plaćanja. DOZVOLJENO SAMO ZA ULOGOVANE KLIJENTE. Generiše Stripe URL za sigurno plaćanje. Cene se validiraju na serveru radi bezbednosti.
 *     tags: [Plaćanje]
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
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Lista kurseva (potreban je samo ID)
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Uspešno kreirana sesija. Vraća URL na koji treba preusmeriti korisnika.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       401:
 *         description: Niste ulogovani ili je sesija nevažeća.
 *       400:
 *         description: Neispravni podaci ili kursevi nisu pronađeni.
 *       500:
 *         description: Greška na serveru.
 */
export const POST = csrf(async function POST(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error("Stripe tajni ključ nedostaje u .env fajlu!");
      return NextResponse.json({ error: "Greška u konfiguraciji servera" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Korpa je prazna" }, { status: 400 });
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

    if (!token) return NextResponse.json({ error: "Niste ulogovani" }, { status: 401 });

    let korisnikId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      korisnikId = decoded.sub;
    } catch {
      return NextResponse.json({ error: "Nevažeća sesija" }, { status: 401 });
    }

    const ids = items.map((i: any) => i.id.toString());
    const kurseviIzBaze = await db.select().from(kurs).where(inArray(kurs.id, ids));

    if (kurseviIzBaze.length === 0) {
      return NextResponse.json({ error: "Kursevi nisu pronađeni u bazi" }, { status: 400 });
    }

    const lineItems = kurseviIzBaze.map((k) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: k.naziv,
          images: k.slika ? [k.slika] : []
        },
        unit_amount: Math.round(Number(k.cena) * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stranice/korpa?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stranice/korpa?canceled=true`,
      metadata: {
        korisnikId: korisnikId,
        kursIds: JSON.stringify(kurseviIzBaze.map(k => k.id.toString())),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout Error:", err.message);
    return NextResponse.json({ error: "Došlo je do greške pri kreiranju plaćanja." }, { status: 500 });
  }
});