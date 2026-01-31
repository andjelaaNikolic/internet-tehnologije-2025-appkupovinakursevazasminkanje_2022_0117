import RoleGuard from "../../components/RoleGuard";
import { db } from "@/db/index";
import { kupljeniKursevi, kurs, korisnik } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import PretragaKlijenata from "./pretragaklijenata";

export default async function PregledKlijenataPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

  if (!token) redirect("/prijava");

  let edukatorId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; uloga: string };

    if (decoded.uloga !== "EDUKATOR" && decoded.uloga !== "ADMIN") {
      redirect("/");
    }

    edukatorId = decoded.sub;
  } catch (err) {
    redirect("/prijava");
    return null;
  }

  const klijenti = await db
    .select({
      korisnikId: kupljeniKursevi.korisnikId,
      ime: korisnik.ime,
      prezime: korisnik.prezime,
      email: korisnik.email,
      brojKurseva: sql<number>`COUNT(${kupljeniKursevi.kursId})`,
    })
    .from(kupljeniKursevi)
    .innerJoin(korisnik, eq(kupljeniKursevi.korisnikId, korisnik.id))
    .innerJoin(kurs, eq(kupljeniKursevi.kursId, kurs.id))
    .where(eq(kurs.edukator, edukatorId))
    .groupBy(kupljeniKursevi.korisnikId, korisnik.ime, korisnik.prezime, korisnik.email);

  const ukupnoKlijenata = klijenti.length;

  return (
    <RoleGuard allowedRoles={["EDUKATOR"]}>
      <div className="min-h-screen bg-[#FFFBE9] p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-[#4a3f35] mb-2">
              Pregled klijenata
            </h1>
            <p className="text-[#AD8B73] font-medium">
              Spisak korisnika koji prate Vaše kurseve
            </p>
          </header>

          {klijenti.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#E3CAA5]">
              <p className="text-[#AD8B73] text-xl font-semibold">
                Još uvek niko nije kupio Vaše kurseve.
              </p>
            </div>
          ) : (
            <PretragaKlijenata klijenti={klijenti} />
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#AD8B73] text-white p-6 rounded-3xl shadow-lg">
              <p className="text-sm opacity-80 font-bold uppercase">Ukupan broj klijenata</p>
              <p className="text-4xl font-black">{ukupnoKlijenata}</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
