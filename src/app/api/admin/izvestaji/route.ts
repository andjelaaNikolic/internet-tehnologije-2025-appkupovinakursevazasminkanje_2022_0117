/*import { NextResponse } from "next/server";
import { getMesecnaStatistikaKlijenata } from "@/app/actions/admin";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/admin/izvestaji:
 *   get:
 *     summary: Mesečna statistika novih klijenata
 *     description: Vraća statističke podatke o broju novih klijenata po mesecima. DOZVOLJENO SAMO ZA ADMINA.
 *     tags: [Izveštaji]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Uspešno dobavljena statistika.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Jan 2024."
 *                       broj:
 *                         type: integer
 *                         example: 15
 *       401:
 *         description: Niste ulogovani (Nedostaje token).
 *       403:
 *         description: Zabranjen pristup (Samo administrator može videti ove izveštaje).
 *       500:
 *         description: Greška na serveru prilikom generisanja izveštaja.
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
          { success: false, error: "Zabranjen pristup. Nemate prava za pregled izveštaja." },
          { status: 403 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Sesija nevažeća ili je istekla." },
        { status: 401 }
      );
    }

    const res = await getMesecnaStatistikaKlijenata();

    if (res.success) {
      return NextResponse.json({ success: true, data: res.data });
    } else {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Greška u API ruti /api/admin/izvestaji:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru" },
      { status: 500 }
    );
  }
}*/

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

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

    return NextResponse.json({ 
      data: { reports: [] }, 
      message: "Uspeh" 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}