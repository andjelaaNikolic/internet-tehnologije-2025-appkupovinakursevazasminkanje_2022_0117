"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, User, Tag, PlayCircle } from "lucide-react";
import { escapeHtml } from "../utils/sanitize";

export default function KupljeniKurseviContent({
  pocetniKursevi = [],
  loading,
  error
}: {
  pocetniKursevi: any[],
  loading?: boolean,
  error?: string
}) {
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const filtriraniKursevi = pocetniKursevi.filter((k) =>
    k?.naziv?.toLowerCase().includes(search.toLowerCase()) ||
    k?.kategorija?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 bg-[#FFFBE9] relative">
      <div className="max-w-7xl mx-auto">


        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-bold text-[--color-primary] border-b-2 border-[--color-accent] pb-2">
            Moji kupljeni kursevi
          </h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-primary]" size={20} />
            <input
              type="text"
              placeholder="Pretraži svoje kurseve..."
              className="auth-input pl-10"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>


        {loading ? (
          <div className="text-center py-20 text-xl text-[--color-primary]">Učitavanje...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-xl">{error}</div>
        ) : (

          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtriraniKursevi.map((k) => (
                <div key={k.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[--color-accent] flex flex-col hover:shadow-2xl transition-all group">
                  <div className="relative h-52 w-full cursor-pointer overflow-hidden" onClick={() => setSelectedCourse(k)}>
                    <Image
                      src={k.slika || "/placeholder.jpg"}
                      alt={k.naziv}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-[--color-secondary] text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {k.kategorija}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-2xl font-bold text-[--color-text] mb-2">{escapeHtml(k.naziv)}</h2>
                    <p
                      className="text-gray-500 text-sm mb-4 line-clamp-2 cursor-pointer hover:text-[--color-primary]"
                      onClick={() => setSelectedCourse(k)}
                    >
                      {escapeHtml(k.opis)} <span className="font-bold underline italic">vidi više</span>
                    </p>

                    <div className="flex items-center gap-2 mb-6">
                      <User size={16} className="text-[--color-primary]" />
                      <span className="text-sm font-medium text-[--color-primary]">
                        {escapeHtml(k.edukatorIme)} {escapeHtml(k.edukatorPrezime)}
                      </span>
                    </div>

                    <div className="border-t border-[--color-accent] pt-4 mt-auto">
                      <Link
                        href={`/stranice/kupljeni-kursevi/${k.id}`}
                        className="auth-btn !py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-xl active:scale-95 transition-all"
                      >
                        <PlayCircle size={20} /> Gledaj kurs
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>


            {selectedCourse && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] backdrop-blur-sm">
                <div className="bg-[#FFFBE9] rounded-3xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl border-2 border-[--color-accent] flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="absolute top-4 right-4 text-[--color-primary] hover:scale-110 transition-transform z-10"
                  >
                    <X size={32} />
                  </button>

                  <div className="mb-4">
                    <h2 className="text-3xl font-bold mb-2 text-[--color-primary] pr-10 leading-tight">
                      {selectedCourse.naziv}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-[--color-accent]/30 px-3 py-1 rounded-full text-[--color-primary]">
                        <Tag size={14} />
                        <span className="text-xs font-bold uppercase">{selectedCourse.kategorija}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[--color-secondary]/20 px-3 py-1 rounded-full text-[--color-primary]">
                        <User size={14} />
                        <span className="text-xs font-bold">Edukator: {selectedCourse.edukatorIme} {selectedCourse.edukatorPrezime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                      <Image src={selectedCourse.slika || "/placeholder.jpg"} alt={selectedCourse.naziv} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[--color-primary] mb-2">O kursu:</h3>
                      <p className="text-[--color-text] leading-relaxed whitespace-pre-line text-lg">
                        {selectedCourse.opis}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[--color-accent]">
                    <Link
                      href={`/stranice/kupljeni-kursevi/${selectedCourse.id}`}
                      className="auth-btn !py-4 flex items-center justify-center gap-3 text-lg"
                    >
                      <PlayCircle size={24} /> Gledaj kurs
                    </Link>
                  </div>
                </div>
              </div>
            )}


            {filtriraniKursevi.length === 0 && (
              <div className="text-center py-20 text-[--color-primary] text-xl font-medium">
                Nemate kupljenih kurseva.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}