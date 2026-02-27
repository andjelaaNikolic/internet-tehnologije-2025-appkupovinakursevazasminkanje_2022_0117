/*import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { kurs } from "@/db/schema";
import { inArray } from "drizzle-orm";

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

    let korisnikId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      korisnikId = decoded.sub;
    } catch {
      return NextResponse.json(
        { success: false, error: "Nevažeća sesija." },
        { status: 401 }
      );
    }

    // 🔹 Podaci iz zahteva
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Korpa je prazna." },
        { status: 400 }
      );
    }

    // 🔹 Dohvatanje kurseva iz baze
    const ids = items.map((i: any) => i.id.toString());
    const kurseviIzBaze = await db.select().from(kurs).where(inArray(kurs.id, ids));

    if (!kurseviIzBaze.length) {
      return NextResponse.json(
        { success: false, error: "Kursevi nisu pronađeni u bazi." },
        { status: 400 }
      );
    }

    // 🔹 Stripe konfiguracija
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: "Greška u konfiguraciji servera." },
        { status: 500 }
      );
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });

    // 🔹 Stripe line items
    const lineItems = kurseviIzBaze.map((k) => ({
      price_data: {
        currency: "eur",
        product_data: { name: k.naziv, images: k.slika ? [k.slika] : [] },
        unit_amount: Math.round(Number(k.cena) * 100),
      },
      quantity: 1,
    }));

    // 🔹 Kreiranje Stripe checkout sesije
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stranice/korpa?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stranice/korpa?canceled=true`,
      metadata: {
        korisnikId,
        kursIds: JSON.stringify(kurseviIzBaze.map(k => k.id.toString())),
      },
    });

    return NextResponse.json({ success: true, url: session.url });

  } catch (err: any) {
    console.error("API /checkout error:", err);
    return NextResponse.json(
      { success: false, error: "Došlo je do greške pri kreiranju plaćanja." },
      { status: 500 }
    );
  }
};
*/
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ message: "Niste ulogovani." }, { status: 401 });
    }

    const decoded = jwt.decode(token) as any;

    if (!decoded || decoded.uloga !== "KLIJENT") {
      return NextResponse.json({ message: "Pristup dozvoljen samo klijentima." }, { status: 403 });
    }

    // Ovde ide tvoja Stripe logika...
    return NextResponse.json({ url: "https://checkout.stripe.com/pay/test" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}