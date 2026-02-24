"use client";

import {
  X, CheckCircle, AlertCircle, Loader2, BookOpen, Euro, Tag,
  Clock, FileText, ChevronUp, ChevronDown
} from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import RoleGuard from "../../components/RoleGuard";
import { VideoUpload } from "../../components/VideoUpload";
import { escapeHtml } from "../../utils/sanitize";
import { fetchKursevi, getKursSaLekcijama, updateKurs } from "../../../lib/kurseviClient";
import { validirajLekciju } from "../../utils/validacijalekcije";

function IzmeniKursSadrzaj() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kursevi, setKursevi] = useState<any[]>([]);
  const [selectedKursId, setSelectedKursId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [kursData, setKursData] = useState({
    naziv: "",
    opis: "",
    cena: "",
    kategorija: "",
    slika: "",
  });

  const [lekcije, setLekcije] = useState<any[]>([]);
  const [trenutnaLekcija, setTrenutnaLekcija] = useState({
    naziv: "",
    opis: "",
    video: "",
    trajanje: "",
  });

  useEffect(() => {
    fetchKursevi().then((res: any) => {
      const listaKurseva = res.kursevi || [];
      setKursevi(listaKurseva);

      const kursIdIzQuery = searchParams.get("kursId");
      if (kursIdIzQuery && listaKurseva.find((k: any) => k.id === kursIdIzQuery)) {
        setSelectedKursId(kursIdIzQuery);
      }
    }).catch(() => { });
  }, [searchParams]);

  useEffect(() => {
    if (!selectedKursId) return;
    let mounted = true;
    (async () => {
      try {
        const kurs = await getKursSaLekcijama(selectedKursId);
        if (!mounted) return;

        setKursData({
          naziv: kurs.naziv || "",
          opis: kurs.opis || "",
          cena: kurs.cena || "",
          kategorija: kurs.kategorija || "",
          slika: kurs.slika || "",
        });
        setLekcije(kurs.lekcije || []);

        setIsPurchased(kurs.jeKupljen || false);

      } catch (err: any) {
        setNotification({ message: err?.message || "Greška pri učitavanju kursa.", type: "error" });
        setSelectedKursId("");
      }
    })();
    return () => { mounted = false; };
  }, [selectedKursId]);

  const pomeriLekciju = (index: number, smer: 'gore' | 'dole') => {
    const noveLekcije = [...lekcije];
    const ciljniIndex = smer === 'gore' ? index - 1 : index + 1;
    if (ciljniIndex < 0 || ciljniIndex >= noveLekcije.length) return;
    [noveLekcije[index], noveLekcije[ciljniIndex]] = [noveLekcije[ciljniIndex], noveLekcije[index]];
    setLekcije(noveLekcije);
  };

  const handleDodajLekcijuUListu = () => {
    if (!trenutnaLekcija.naziv.trim() || !trenutnaLekcija.opis.trim() || !trenutnaLekcija.trajanje || !trenutnaLekcija.video) {
      setNotification({ message: "Niste popunili sve podatke o lekciji!", type: "error" });
      return;
    }
    const error = validirajLekciju(trenutnaLekcija);
    if (error) {
      setNotification({ message: error, type: "error" });
      return;
    }
    setLekcije((prev) => [...prev, trenutnaLekcija]);
    setTrenutnaLekcija({ naziv: "", opis: "", video: "", trajanje: "" });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedKursId) return;

  setLoading(true);
  try {
    const res = await updateKurs(String(selectedKursId), {
      id: selectedKursId, 
      ...kursData,
      lekcije,
    });

    if (res.success) {
      setNotification({ message: "Kurs uspešno izmenjen!", type: "success" });
      setTimeout(() => router.push("/stranice/svi-kursevi"), 2000);
    } else {
      setNotification({ message: res.error || "Greška.", type: "error" });
    }
  } catch (err) {
    setNotification({ message: "Problem sa serverom.", type: "error" });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-wrap min-h-screen pb-20 block">
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-[--color-accent] max-w-sm w-full text-center">
            <div className={`mx-auto mb-4 p-3 rounded-full w-fit ${notification.type === "success" ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"}`}>
              {notification.type === "success" ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
            </div>
            <p className="text-lg font-bold mb-6">{escapeHtml(notification?.message)}</p>
            <button onClick={() => setNotification(null)} className="auth-btn !mt-0">Zatvori</button>
          </div>
        </div>
      )}

      <div className="auth-card max-w-2xl mx-auto mt-10 border-b-4 border-[--color-accent]">
        <div className="flex items-center gap-3 mb-4 text-[--color-primary]">
          <BookOpen size={24} />
          <label className="contact-label !mb-0 text-xl">Koji kurs želite da izmenite?</label>
        </div>
        <select
          className="auth-input cursor-pointer"
          value={selectedKursId}
          onChange={(e) => setSelectedKursId(e.target.value)}
        >
          <option value="">-- Odaberite kurs --</option>
          {kursevi.map((k) => (
            <option key={k.id} value={k.id}>{k.naziv}</option>
          ))}
        </select>
      </div>

      {selectedKursId && (
        <div className="auth-card max-w-4xl mx-auto mt-10">
          <h1 className="text-2xl font-bold mb-6 text-[--color-primary] border-b border-[--color-accent] pb-2 text-center uppercase tracking-widest">
            Promena podataka o kursu
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div>
                  <label className="contact-label">Naziv kursa</label>
                  <input className="auth-input" value={kursData.naziv} onChange={(e) => setKursData((p) => ({ ...p, naziv: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="contact-label flex items-center gap-1"><Euro size={14} /> Cena (€)</label>
                    <input type="number" step="0.01" className="auth-input" value={kursData.cena} onChange={(e) => setKursData((p) => ({ ...p, cena: e.target.value }))} />
                  </div>
                  <div>
                    <label className="contact-label flex items-center gap-1"><Tag size={14} /> Kategorija</label>
                    <input className="auth-input" value={kursData.kategorija} onChange={(e) => setKursData((p) => ({ ...p, kategorija: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="contact-label">Naslovna slika</label>
                {kursData.slika ? (
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden border-2 border-[--color-accent]">
                    <Image src={kursData.slika} alt="Slika" fill className="object-cover" />
                    <button type="button" onClick={() => setKursData((p) => ({ ...p, slika: "" }))} className="absolute top-2 right-2 bg-white rounded-full p-1"><X size={20} /></button>
                  </div>
                ) : <VideoUpload label="Postavi sliku" onUploadSuccess={(url) => setKursData((p) => ({ ...p, slika: url }))} />}
              </div>
            </div>

            <div className="text-left">
              <label className="contact-label">Opis kursa</label>
                  <textarea className="auth-input min-h-[100px]" value={kursData.opis} onChange={(e) => setKursData((p) => ({ ...p, opis: e.target.value }))} />
            </div>

            <hr className="border-[--color-accent] opacity-30" />

            <div className="p-6 rounded-3xl border-2 border-dashed border-[--color-secondary] bg-white/40 space-y-4 text-left">
              <h2 className="text-lg font-bold text-[--color-primary] text-center italic underline flex items-center justify-center gap-2">
                <FileText size={20} /> Upravljanje lekcijama
              </h2>

              {isPurchased && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-700 text-sm">
                  <AlertCircle size={18} />
                  <span>Ovaj kurs je već kupljen. Brisanje postojećih lekcija je onemogućeno radi zaštite korisnika.</span>
                </div>
              )}

              <div className="space-y-2">
                {lekcije.map((l, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[--color-accent] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => pomeriLekciju(idx, 'gore')} className="text-gray-400 hover:text-[--color-primary] disabled:opacity-30" disabled={idx === 0}>
                          <ChevronUp size={20} />
                        </button>
                        <button type="button" onClick={() => pomeriLekciju(idx, 'dole')} className="text-gray-400 hover:text-[--color-primary] disabled:opacity-30" disabled={idx === lekcije.length - 1}>
                          <ChevronDown size={20} />
                        </button>
                      </div>
                      <div>
                        <span className="text-sm font-bold block">{idx + 1}. {l.naziv}</span>
                        <span className="text-xs text-gray-400">{l.trajanje} sekundi</span>
                      </div>
                    </div>

                    {!isPurchased && (
                      <button
                        type="button"
                        onClick={() => setLekcije((p) => p.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-[--color-accent]/10 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-[--color-primary] uppercase italic">Dodaj novu lekciju:</p>
                <input className="auth-input" placeholder="Naziv" value={trenutnaLekcija.naziv} onChange={(e) => setTrenutnaLekcija(p => ({ ...p, naziv: e.target.value }))} />
                <input className="auth-input" type="number" placeholder="Trajanje (sekunde)" value={trenutnaLekcija.trajanje} onChange={(e) => setTrenutnaLekcija(p => ({ ...p, trajanje: e.target.value }))} />
                <textarea className="auth-input min-h-[60px]" placeholder="Opis" value={trenutnaLekcija.opis} onChange={(e) => setTrenutnaLekcija(p => ({ ...p, opis: e.target.value }))} />

                {!trenutnaLekcija.video ? (
                  <VideoUpload label="Otpremi video" onUploadSuccess={(url) => setTrenutnaLekcija(p => ({ ...p, video: url }))} />
                ) : <div className="p-2 bg-green-50 text-green-700 rounded-xl text-center font-bold text-xs">✅ Video spreman</div>}

                <button type="button" onClick={handleDodajLekcijuUListu} className="auth-btn !py-2 bg-[--color-secondary]">+ Dodaj u listu</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-btn !py-4 text-lg">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "SAČUVAJ SVE IZMENE"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function IzmeniKursPage() {
  return (
    <RoleGuard allowedRoles={["EDUKATOR"]}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#FFFBE9]">
          <div className="text-center">
            <Loader2 className="animate-spin text-[--color-primary] mb-4 mx-auto" size={48} />
            <p className="text-[#AD8B73] font-bold">Učitavanje alata za izmenu...</p>
          </div>
        </div>
      }>
        <IzmeniKursSadrzaj />
      </Suspense>
    </RoleGuard>
  );
}