/*import { NextResponse } from "next/server";
import { getStatistikaProdajeKurseva } from "@/app/actions/admin";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

/**
 * @swagger
 * /api/admin/statistika-prodaje:
 *   get:
 *     summary: Statistika prodaje po kursevima
 *     description: Vraća zbirne podatke o prodaji za svaki kurs. DOZVOLJENO SAMO ZA ADMINA.
 *     tags: [Izveštaji]
 *     security:              
 *       - BearerAuth: []      
 *     responses:
 *       200:
 *         description: Uspešno dobavljena statistika prodaje.
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
 *                       naziv:
 *                         type: string
 *                         description: Naziv kursa
 *                       prihod:
 *                         type: number
 *                         description: Ukupna zarada od ovog kursa
 *                       prodato:
 *                         type: integer
 *                         description: Broj prodatih licenci/pristupa
 *       401:                    
 *         description: Niste ulogovani (Nedostaje token).
 *       403:                     
 *         description: Zabranjen pristup (Samo administrator može videti statistiku prodaje).
 *       500:
 *         description: Greška na serveru prilikom generisanja statistike.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
      return NextResponse.json({ success: false, error: "Niste ulogovani." }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.uloga !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Zabranjen pristup. Samo administrator može videti statistiku." },
          { status: 403 }
        );
      }
    } catch (err) {
      return NextResponse.json({ success: false, error: "Sesija nevažeća ili je istekla." }, { status: 401 });
    }

    const res = await getStatistikaProdajeKurseva();

    if (res.success) {
      return NextResponse.json(res);
    } else {
      const statusKod = (res as any).status || 500;
      return NextResponse.json(
        { success: false, error: res.error },
        { status: statusKod }
      );
    }

  } catch (error) {
    console.error("Greška u API ruti /api/admin/statistika-prodaje:", error);
    return NextResponse.json(
      { success: false, error: "Greška na serveru prilikom generisanja statistike." },
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
      stats: { total: 0, count: 0 } 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}