/*"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "../context/KorpaContext";
import { escapeHtml } from "../utils/sanitize";
import {
  Search,
  ShoppingBasket,
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Tag,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Clock,
  Euro
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchKursevi, getKursSaLekcijama, obrisiKurs } from "@/lib/kurseviClient";

export default function KurseviContent() {
  const [kursevi, setKursevi] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<"KLIJENT" | "EDUKATOR" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedKursToDelete, setSelectedKursToDelete] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { addToCart, cart } = useCart();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedCourse) return;
      if (userRole === "EDUKATOR" && String(selectedCourse.edukatorId) === String(userId)) {
        setLoadingCourseDetails(true);
        try {
          const detalji = await getKursSaLekcijama(selectedCourse.id);
          if (!mounted) return;
          setSelectedCourse((prev: any) => ({ ...prev, ...detalji }));
        } catch (err: any) {
          setNotification({ message: err?.message || "Greška pri učitavanju detalja kursa.", type: "error" });
        } finally {
          if (mounted) setLoadingCourseDetails(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [selectedCourse?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchKursevi();
        if (mounted) {
          setKursevi(data.kursevi || []);
          setUserRole((data.userRole as any) || null);
          setUserId(data.userId || null);
        }
      } catch (err: any) {
        setNotification({ message: err.message || "Greška pri učitavanju kurseva.", type: "error" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="auth-wrap !block min-h-screen !p-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="auth-card text-center py-20">
            Učitavanje kurseva...
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = (k: any) => {
    const vecUKorpi = cart.find((item) => item.id === k.id);
    if (vecUKorpi) {
      setNotification({ message: "Ovaj kurs se već nalazi u vašoj korpi.", type: "error" });
    } else {
      addToCart({ id: k.id, naziv: k.naziv, cena: k.cena, slika: k.slika });
      setNotification({ message: "Kurs je uspešno dodat u korpu!", type: "success" });
    }
  };

  const handleReviewDelete = async (id: string) => {
    setLoadingDetails(true);
    try {
      const detalji = await getKursSaLekcijama(id);
      setSelectedKursToDelete(detalji);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setNotification({ message: "Greška pri učitavanju detalja.", type: "error" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const izvrsiBrisanje = async () => {
    if (!selectedKursToDelete) return;
    setIsDeleting(true);
    try {
      const res = await obrisiKurs(selectedKursToDelete.id);
      if (res.success) {
        setNotification({ message: "Kurs je uspešno obrisan!", type: "success" });
        setKursevi(prev => prev.filter(k => k.id !== selectedKursToDelete.id));
        setSelectedKursToDelete(null);
      } else {
        setNotification({ message: res.error || "Greška pri brisanju.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Greška na serveru.", type: "error" });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filtriraniKursevi = kursevi.filter((k) =>
    k.naziv.toLowerCase().includes(search.toLowerCase()) ||
    k.kategorija.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="auth-wrap !block min-h-screen !p-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 md:p-10">

        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-[5000] p-4 bg-black/40 backdrop-blur-[2px]">
            <div className="auth-card flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-300">
              <div className={`mb-4 p-4 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {notification.type === "success" ? <CheckCircle size={48} className="text-green-500" /> : <AlertTriangle size={48} className="text-red-500" />}
              </div>
              <p className="text-xl font-bold text-center text-[--color-text] mb-6 uppercase tracking-tight">{escapeHtml(notification.message)}</p>
              <button onClick={() => setNotification(null)} className="auth-btn !mt-0 !py-2 !px-8">Zatvori</button>
            </div>
          </div>
        )}

        {selectedKursToDelete ? (
          <div className="animate-in slide-in-from-bottom-10 duration-500 max-w-4xl mx-auto py-10">
            <button
              onClick={() => setSelectedKursToDelete(null)}
              className="mb-8 flex items-center gap-2 bg-[#4a3f35] text-white font-bold py-3 px-8 rounded-2xl shadow-xl hover:bg-[#AD8B73] transition-all uppercase text-xs tracking-widest border-2 border-white/20"
            >
              <ArrowLeft size={18} /> Odustani i vrati se na listu
            </button>

            <div className="auth-card !max-w-none border-t-8 border-red-500">
              <h1 className="text-2xl font-bold mb-8 text-[--color-primary] border-b border-[--color-accent] pb-2 text-center uppercase tracking-widest">
                Konačna provera pre brisanja
              </h1>

              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="auth-label">Naziv Kursa</label>
                      <div className="auth-input !bg-white/70">{escapeHtml(selectedKursToDelete.naziv)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="auth-label">Cena (€)</label>
                        <div className="auth-input !bg-white/70">{selectedKursToDelete.cena}</div>
                      </div>
                      <div>
                        <label className="auth-label">Kategorija</label>
                        <div className="auth-input !bg-white/70">{selectedKursToDelete.kategorija}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="auth-label">Naslovna slika</label>
                    <div className="relative h-40 rounded-2xl overflow-hidden border-2 border-[--color-accent]">
                      <Image src={selectedKursToDelete.slika} alt="Preview" fill className="object-cover" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="auth-label">Opis kursa</label>
                  <div className="auth-input !bg-white/70 min-h-[100px] leading-relaxed text-sm italic">
                    {escapeHtml(selectedKursToDelete.opis)}
                  </div>
                </div>

                <div className="p-6 rounded-3xl border-2 border-dashed border-[--color-secondary] bg-white/40">
                  <h2 className="text-lg font-bold text-[--color-primary] text-center italic underline mb-6 uppercase tracking-tight">Lekcije koje će biti obrisane</h2>
                  <div className="space-y-3">
                    {selectedKursToDelete.lekcije?.map((l: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-[#FFFBE9] p-4 rounded-2xl border border-[--color-accent] shadow-sm">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-[--color-text]">{escapeHtml(l.naziv)}</span>
                          <span className="text-[10px] text-gray-400 italic">Lekcija {idx + 1}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[--color-secondary] flex items-center gap-1 uppercase tracking-widest">
                          <Clock size={14} /> {l.trajanje} sekunde
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                  <button onClick={() => setSelectedKursToDelete(null)} className="auth-btn !mt-0 !bg-[#4a3f35] text-white shadow-xl hover:bg-[#AD8B73]">
                    ODUSTANI OD BRISANJA
                  </button>
                  <button onClick={izvrsiBrisanje} disabled={isDeleting} className="auth-btn !mt-0 !bg-red-600 hover:!bg-red-700 shadow-xl">
                    {isDeleting ? <Loader2 className="animate-spin" size={24} /> : (
                      <span className="flex items-center gap-2 font-black uppercase tracking-widest"><Trash2 size={22} /> Potvrdi brisanje</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 auth-card !max-w-none">
              <h1 className="text-3xl font-bold text-[--color-primary] uppercase tracking-widest">
                {userRole === "EDUKATOR" ? "Moji kursevi" : "Istražite kurseve"}
              </h1>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-primary]" size={20} />
                <input
                  type="text"
                  placeholder="Pretraži kurseve..."
                  className="auth-input pl-10"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtriraniKursevi.map((k) => (
                <div key={k.id} className="auth-card !p-0 overflow-hidden flex flex-col hover:shadow-2xl transition-all group">
                  <div className="relative h-52 w-full cursor-pointer overflow-hidden" onClick={() => setSelectedCourse(k)}>
                    <Image src={k.slika || "/placeholder.jpg"} alt={k.naziv} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-[--color-secondary] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{k.kategorija}</div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow text-left">
                    <h2 className="text-xl font-bold text-[--color-text] mb-2 uppercase tracking-tighter line-clamp-1">{escapeHtml(k.naziv)}</h2>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2 italic cursor-pointer" onClick={() => setSelectedCourse(k)}>
                      {escapeHtml(k.opis)}
                    </p>

                    <div className="flex items-center gap-2 mb-6">
                      <User size={14} className="text-[--color-primary]" />
                      <span className="text-xs font-bold text-[--color-primary]">{k.edukatorIme} {k.edukatorPrezime}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[--color-accent] pt-4 mt-auto">
                      <span className="text-xl font-black text-[--color-primary]">{k.cena} €</span>

                      {userRole === "KLIJENT" ? (
                        <button onClick={() => handleAddToCart(k)} className="auth-btn !w-auto !py-2 !px-4 !mt-0 text-xs">
                          <ShoppingBasket size={18} /> Kupi
                        </button>
                      ) : userRole === "EDUKATOR" && k.edukatorId === userId ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/stranice/promena-kurseva?kursId=${k.id}`)}
                            className="bg-white border-2 border-[--color-accent] text-[--color-primary] p-2 rounded-xl hover:bg-[--color-accent] hover:text-white transition-all"
                            title="Izmeni"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleReviewDelete(k.id)}
                            className="bg-red-50 text-red-500 border-2 border-red-100 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            title="Obriši"
                          >
                            {loadingDetails ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedCourse && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] backdrop-blur-sm">
            <div className="auth-card !max-w-2xl w-full p-6 md:p-8 relative flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
              <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 text-[--color-primary] hover:rotate-90 transition-transform">
                <X size={32} />
              </button>

              <div className="mb-4 text-left">
                <h2 className="text-2xl font-bold mb-2 text-[--color-primary] uppercase tracking-widest">{escapeHtml(selectedCourse.naziv)}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[--color-accent]/30 px-3 py-1 rounded-full text-[10px] font-bold text-[--color-primary] uppercase">{selectedCourse.kategorija}</span>
                  <span className="bg-[--color-secondary]/20 px-3 py-1 rounded-full text-[10px] font-bold text-[--color-primary] uppercase">Edukator: {selectedCourse.edukatorIme}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-left">
                <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-md">
                  <Image src={selectedCourse.slika || "/placeholder.jpg"} alt={selectedCourse.naziv} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[--color-primary] mb-2 border-b border-[--color-accent] pb-1">Opis kursa:</h3>
                  <p className="text-[--color-text] leading-relaxed text-sm italic">{escapeHtml(selectedCourse.opis)}</p>
                </div>

                {loadingCourseDetails ? (
                  <div className="auth-card text-center py-4">Učitavanje detalja kursa...</div>
                ) : selectedCourse.lekcije && selectedCourse.lekcije.length > 0 ? (
                  <div className="p-6 rounded-3xl border-2 border-dashed border-[--color-secondary] bg-white/40">
                    <h2 className="text-lg font-bold text-[--color-primary] text-center italic underline mb-6 uppercase tracking-tight">Sadržaj kursa</h2>
                    <div className="space-y-3">
                      {selectedCourse.lekcije.map((l: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-[--color-bg] p-4 rounded-2xl border border-[--color-accent] shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[--color-text]">{escapeHtml(l.naziv)}</span>
                            <span className="text-[10px] text-gray-400 italic">Lekcija {idx + 1}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[--color-secondary] flex items-center gap-1 uppercase tracking-widest">
                            <Clock size={14} /> {l.trajanje} sekunde
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {userRole === "KLIJENT" && (
                <div className="flex justify-between items-center border-t border-[--color-accent] pt-6 mt-4">
                  <span className="text-3xl font-black text-[--color-primary]">{selectedCourse.cena} €</span>
                  <button onClick={() => { handleAddToCart(selectedCourse); setSelectedCourse(null); }} className="auth-btn !w-auto !px-10">
                    Kupi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {filtriraniKursevi.length === 0 && !selectedKursToDelete && (
          <div className="auth-card !max-w-none text-center py-20 italic font-bold text-[--color-primary]">
            Nije pronađen nijedan kurs koji odgovara vašoj pretrazi.
          </div>
        )}
      </div>
    </div>
  );
}
  */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "../context/KorpaContext";
import { escapeHtml } from "../utils/sanitize";
import {
  Search,
  ShoppingBasket,
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchKursevi, getKursSaLekcijama, obrisiKurs } from "@/lib/kurseviClient";

export default function KurseviContent() {
  const [kursevi, setKursevi] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<"KLIJENT" | "EDUKATOR" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKursToDelete, setSelectedKursToDelete] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { addToCart, cart } = useCart();
  const router = useRouter();

  // 📦 Dodavanje u korpu
  const handleAddToCart = (k: any) => {
    const vecUKorpi = cart.find((item) => item.id === k.id);
    if (vecUKorpi) {
      setNotification({ message: "Ovaj kurs se već nalazi u vašoj korpi.", type: "error" });
    } else {
      addToCart({ id: k.id, naziv: k.naziv, cena: k.cena, slika: k.slika });
      setNotification({ message: "Kurs je uspešno dodat u korpu!", type: "success" });
    }
  };

  // 🛒 Checkout funkcija
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setNotification({ message: "Korpa je prazna.", type: "error" });
      return;
    }

    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/klijent/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setNotification({ message: data.error || "Greška prilikom plaćanja.", type: "error" });
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Greška na serveru.", type: "error" });
      setCheckoutLoading(false);
    }
  };

  // 🔎 Fetch kurseva
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchKursevi();
        if (mounted) {
          setKursevi(data.kursevi || []);
          setUserRole(data.userRole || null);
          setUserId(data.userId || null);
        }
      } catch (err: any) {
        setNotification({ message: err.message || "Greška pri učitavanju kurseva.", type: "error" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ⚠️ Brisanje kursa
  const handleReviewDelete = async (id: string) => {
    setLoadingDetails(true);
    try {
      const detalji = await getKursSaLekcijama(id);
      setSelectedKursToDelete(detalji);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setNotification({ message: "Greška pri učitavanju detalja.", type: "error" });
    } finally {
      setLoadingDetails(false);
    }
  };

  const izvrsiBrisanje = async () => {
    if (!selectedKursToDelete) return;
    setIsDeleting(true);
    try {
      const res = await obrisiKurs(selectedKursToDelete.id);
      if (res.success) {
        setNotification({ message: "Kurs je uspešno obrisan!", type: "success" });
        setKursevi(prev => prev.filter(k => k.id !== selectedKursToDelete.id));
        setSelectedKursToDelete(null);
      } else {
        setNotification({ message: res.error || "Greška pri brisanju.", type: "error" });
      }
    } catch {
      setNotification({ message: "Greška na serveru.", type: "error" });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) return <div className="auth-card text-center py-20">Učitavanje kurseva...</div>;

  const filtriraniKursevi = kursevi.filter((k) =>
    k.naziv.toLowerCase().includes(search.toLowerCase()) ||
    k.kategorija.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="auth-wrap !block min-h-screen !p-0 overflow-y-auto">
      {/* 🔔 Notifikacije */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-[5000] p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="auth-card flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-300">
            <div className={`mb-4 p-4 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {notification.type === "success" ? <CheckCircle size={48} className="text-green-500" /> : <AlertTriangle size={48} className="text-red-500" />}
            </div>
            <p className="text-xl font-bold text-center text-[--color-text] mb-6 uppercase tracking-tight">{escapeHtml(notification.message)}</p>
            <button onClick={() => setNotification(null)} className="auth-btn !mt-0 !py-2 !px-8">Zatvori</button>
          </div>
        </div>
      )}

      {/* 🔎 Pretraga */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 auth-card !max-w-none">
        <h1 className="text-3xl font-bold text-[--color-primary] uppercase tracking-widest">
          {userRole === "EDUKATOR" ? "Moji kursevi" : "Istražite kurseve"}
        </h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-primary]" size={20} />
          <input type="text" placeholder="Pretraži kurseve..." className="auth-input pl-10" onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* 📝 Lista kurseva */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtriraniKursevi.map((k) => (
          <div key={k.id} className="auth-card !p-0 overflow-hidden flex flex-col hover:shadow-2xl transition-all group">
            <div className="relative h-52 w-full cursor-pointer overflow-hidden">
              <Image src={k.slika || "/placeholder.jpg"} alt={k.naziv} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4 bg-[--color-secondary] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{k.kategorija}</div>
            </div>

            <div className="p-6 flex flex-col flex-grow text-left">
              <h2 className="text-xl font-bold text-[--color-text] mb-2 uppercase tracking-tighter line-clamp-1">{escapeHtml(k.naziv)}</h2>
              <p className="text-gray-500 text-xs mb-4 line-clamp-2 italic cursor-pointer">
                {escapeHtml(k.opis)}
              </p>

              <div className="flex items-center gap-2 mb-6">
                <User size={14} className="text-[--color-primary]" />
                <span className="text-xs font-bold text-[--color-primary]">{k.edukatorIme} {k.edukatorPrezime}</span>
              </div>

              <div className="flex items-center justify-between border-t border-[--color-accent] pt-4 mt-auto">
                <span className="text-xl font-black text-[--color-primary]">{k.cena} €</span>

                {userRole === "KLIJENT" && (
                  <button onClick={() => handleAddToCart(k)} className="auth-btn !w-auto !py-2 !px-4 !mt-0 text-xs">
                    <ShoppingBasket size={18} /> Kupi
                  </button>
                )}

                {userRole === "EDUKATOR" && (
                  <button onClick={() => handleReviewDelete(k.id)} className="auth-btn !w-auto !py-2 !px-4 !mt-0 text-xs">
                    <X size={18} /> Obriši
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🛒 Checkout dugme fiksirano na dnu */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 md:right-10 bg-white shadow-xl p-4 rounded-3xl flex items-center gap-4 z-[1000]">
          <span className="font-bold text-lg">Ukupno: {cart.reduce((sum, i) => sum + Number(i.cena), 0)} €</span>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="auth-btn !px-6 !py-2 flex items-center gap-2"
          >
            {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : "POTVRDI I PLATI"}
          </button>
        </div>
      )}

      {/* 🧹 Modal za potvrdu brisanja */}
      {selectedKursToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-[5000] p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="auth-card flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-300">
            <p className="text-xl font-bold text-center text-[--color-text] mb-6">
              Da li ste sigurni da želite obrisati kurs: <br />
              <span className="text-[--color-primary]">{selectedKursToDelete.naziv}</span>?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setSelectedKursToDelete(null)} className="auth-btn !px-6 !py-2">Odustani</button>
              <button onClick={izvrsiBrisanje} disabled={isDeleting} className="auth-btn !px-6 !py-2 bg-red-500 text-white">
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Obriši"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}