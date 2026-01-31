import RoleGuard from "../../components/RoleGuard";
import { db } from "@/db/index";
import { kupljeniKursevi, kurs, korisnik } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

export default async function PregledKlijenataPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  const JWT_SECRET = process.env.JWT_SECRET || "tvoja_tajna_sifra_123";

  if (!token) redirect("/prijava");

  let edukatorId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string, uloga: string };

    if (decoded.uloga !== "EDUKATOR" && decoded.uloga !== "ADMIN") {
      redirect("/");
    }

    edukatorId = decoded.sub;
  } catch (err) {
    redirect("/prijava");
    return null;
  }

  const kursevi = await db
    .select({
      kursId: kurs.id,
      naziv: kurs.naziv,
    })
    .from(kurs)
    .where(eq(kurs.edukator, edukatorId));

  const kurseviSaKlijentima = await Promise.all(
    kursevi.map(async (k) => {
      const klijenti = await db
        .select({
          klijentIme: korisnik.ime,
          klijentPrezime: korisnik.prezime,
          klijentEmail: korisnik.email,
          datumKupovine: kupljeniKursevi.datum,
          metodPlacanja: kupljeniKursevi.metodPlacanja,
          statusPlacanja: kupljeniKursevi.statusPlacanja,
        })
        .from(kupljeniKursevi)
        .innerJoin(korisnik, eq(kupljeniKursevi.korisnikId, korisnik.id))
        .where(eq(kupljeniKursevi.kursId, k.kursId))
        .orderBy(desc(kupljeniKursevi.datum));

      return { ...k, klijenti };
    })
  );

  return (
    <RoleGuard allowedRoles={["EDUKATOR"]}>
      <div className="min-h-screen bg-[#FFFBE9] p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-[#4a3f35] mb-2">
              Pregled prodaje po kursevima
            </h1>
            <p className="text-[#AD8B73] font-medium">
              Spisak korisnika koji su kupili Vaše kurseve
            </p>
          </header>

          {kurseviSaKlijentima.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#E3CAA5]">
              <p className="text-[#AD8B73] text-xl font-semibold">
                Još uvek niko nije kreirao kurseve ili ih kupio.
              </p>
            </div>
          ) : (
            kurseviSaKlijentima.map((k, idx) => (
              <div key={idx} className="mb-10">
                <h2 className="text-2xl font-bold text-[#4a3f35] mb-4 flex items-center gap-2">
                {k.naziv} 
                <span className="text-2xl font-bold text-[#AD8B73]">
                    (Broj klijenata: {k.klijenti.length})
                </span>
                </h2>

                {k.klijenti.length === 0 ? (
                  <p className="text-[#AD8B73] mb-4">Još uvek niko nije kupio ovaj kurs.</p>
                ) : (
                  <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E3CAA5]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#AD8B73] text-white">
                            <th className="p-5 font-bold uppercase text-sm tracking-wider">Klijent</th>
                            <th className="p-5 font-bold uppercase text-sm tracking-wider">Kontakt</th>
                            <th className="p-5 font-bold uppercase text-sm tracking-wider">Metod plaćanja</th>
                            <th className="p-5 font-bold uppercase text-sm tracking-wider">Status plaćanja</th>
                            <th className="p-5 font-bold uppercase text-sm tracking-wider text-center">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E3CAA5]">
                          {k.klijenti.map((kl, i) => (
                            <tr key={i} className="hover:bg-[#FFFBE9]/50 transition-colors">
                              <td className="p-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#E3CAA5] rounded-full flex items-center justify-center text-[#AD8B73] font-bold">
                                    {kl.klijentIme[0]}{kl.klijentPrezime[0]}
                                  </div>
                                  <span className="font-bold text-[#4a3f35]">
                                    {kl.klijentIme} {kl.klijentPrezime}
                                  </span>
                                </div>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2 text-[#AD8B73]">
                                  <Mail size={16} />
                                  <span className="text-sm">{kl.klijentEmail}</span>
                                </div>
                              </td>
                              <td className="p-5">
                                <span className="font-medium text-[#4a3f35]">{kl.metodPlacanja}</span>
                              </td>
                              <td className="p-5">
                                <span className="font-medium text-[#4a3f35]">{kl.statusPlacanja}</span>
                              </td>
                              <td className="p-5 text-center">
                                <span className="text-sm font-bold text-[#AD8B73]">
                                  {new Date(kl.datumKupovine).toLocaleDateString("sr-RS")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
