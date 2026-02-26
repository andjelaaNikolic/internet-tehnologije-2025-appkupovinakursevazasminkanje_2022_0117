import { NextResponse } from "next/server";
import { dodajKorisnikaAction } from "@/app/actions/korisnik";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/admin/korisnik:
 *   post:
 *     summary: Ručno dodavanje novog korisnika
 *     description: Kreira novog korisnika u bazi podataka. DOZVOLJENO SAMO ZA ADMINA.
 *     tags: [Korisnici]
 *     security:               
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ime
 *               - prezime
 *               - email
 *               - lozinka
 *               - uloga
 *             properties:
 *               ime:
 *                 type: string
 *                 example: Jovan
 *               prezime:
 *                 type: string
 *                 example: Jovanović
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jovan@example.com
 *               lozinka:
 *                 type: string
 *                 format: password
 *                 example: Sifra123!
 *               uloga:
 *                 type: string
 *                 enum: [KLIJENT, EDUKATOR, ADMIN]
 *                 example: KLIJENT
 *     responses:
 *       200:
 *         description: Uspešno dodat korisnik.
 *       401:                     
 *         description: Niste ulogovani (Nedostaje token).
 *       403:                     
 *         description: Zabranjen pristup (Samo administrator može ručno dodavati korisnike).
 *       500:
 *         description: Greška na serveru prilikom dodavanja korisnika.
 */
export const POST = async function POST(req: Request) {
  try {
    // 🔑 Provera JWT
    let token: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth")?.value;
    }

    if (!token) {
      return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.uloga !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Zabranjen pristup. Samo administrator može dodavati korisnike." },
          { status: 403 }
        );
      }
    } catch (err) {
      return NextResponse.json({ success: false, error: "Sesija nevažeća ili je istekla." }, { status: 401 });
    }

    // Dobavljanje tela zahteva
    const body = await req.json();

    if (!body.email || !body.lozinka || !body.uloga) {
      return NextResponse.json({ success: false, error: "Nedostaju obavezni podaci (email, lozinka ili uloga)." }, { status: 400 });
    }

    // Dodavanje korisnika
    const result = await dodajKorisnikaAction(body);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

  } catch (err) {
    console.error("Greška u API ruti /api/admin/korisnik:", err);
    return NextResponse.json({ success: false, error: "Greška na serveru prilikom dodavanja korisnika." }, { status: 500 });
  }
};