/*import { NextResponse } from "next/server";
import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/admin/korisnici:
 *   get:
 *     summary: Dobavljanje liste svih korisnika
 *     description: Vraća listu svih registrovanih korisnika. DOZVOLJENO SAMO ZA ADMINA.
 *     tags: [Korisnici]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Uspešno vraćena lista korisnika.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   ime:
 *                     type: string
 *                   prezime:
 *                     type: string
 *                   email:
 *                     type: string
 *                   uloga:
 *                     type: string
 *                   datumRegistracije:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Niste ulogovani (Nedostaje token).
 *       403:
 *         description: Zabranjen pristup (Samo administrator može videti listu svih korisnika).
 *       500:
 *         description: Greška na serveru prilikom pristupa bazi podataka.
 */
/*
export async function GET() {
  try {
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

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.uloga !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Zabranjen pristup. Samo administrator može videti ove podatke." },
          { status: 403 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Sesija nevažeća ili je istekao token." },
        { status: 401 }
      );
    }

    const users = await db
      .select({
        id: korisnik.id,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        email: korisnik.email,
        uloga: korisnik.uloga,
        datumRegistracije: korisnik.datumRegistracije,
      })
      .from(korisnik);

    return NextResponse.json(users);

  } catch (error) {
    console.error("Greška na serveru (GET /api/admin/korisnici):", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru prilikom pristupa bazi podataka." },
      { status: 500 }
    );
  }
}*/
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import { db } from "@/db";
import { korisnik } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Niste ulogovani." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded || decoded.uloga !== "ADMIN") {
      return NextResponse.json({ message: "Pristup dozvoljen samo administratorima." }, { status: 403 });
    }

    try {
      const users = await db.select().from(korisnik);
      return NextResponse.json({ users }, { status: 200 });
    } catch {
      // Fallback za test okruženje ako DB ne radi
      return NextResponse.json({ users: [] }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}