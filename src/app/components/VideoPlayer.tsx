"use client";
import { useState } from "react";
import { sacuvajNapredak } from "../actions/napredak";
import { CheckCircle, Play, Circle, PlayCircle } from "lucide-react";
import { escapeHtml } from "../utils/sanitize";

export default function VideoPlayer({
  lekcije,
  korisnikId,
  inicijalniNapredak
}: {
  lekcije: any[],
  korisnikId: string,
  inicijalniNapredak: string[]
}) {
  const [aktivnaLekcija, setAktivnaLekcija] = useState(lekcije[0]);
  const [zavrseneLekcije, setZavrseneLekcije] = useState<string[]>(inicijalniNapredak);

  const procenat = Math.round((zavrseneLekcije.length / lekcije.length) * 100);

  const handleVideoEnded = async () => {
    if (korisnikId && !zavrseneLekcije.includes(aktivnaLekcija.id)) {
      await sacuvajNapredak(aktivnaLekcija.id);
      setZavrseneLekcije((prev) => [...prev, aktivnaLekcija.id]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-[#AD8B73]">
          <video
            key={aktivnaLekcija.id}
            controls
            onEnded={handleVideoEnded}
            className="w-full h-full"
            controlsList="nodownload"
          >
            <source src={aktivnaLekcija.video} type="video/mp4" />
          </video>
        </div>

        <div className="mt-6 p-6 bg-white rounded-3xl shadow-sm border border-[#E3CAA5]">
          <h2 className="text-2xl font-bold text-[#4a3f35]">{escapeHtml(aktivnaLekcija.naziv)}</h2>
          <div className="h-1 w-20 bg-[#AD8B73] my-4 rounded-full"></div>
          <p className="text-[#4a3f35] leading-relaxed opacity-90">{escapeHtml(aktivnaLekcija.opis)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        <div className="bg-white p-5 rounded-3xl shadow-md border border-[#E3CAA5]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-[#4a3f35]">Napredak</span>
            <span className="text-lg font-black text-[#AD8B73]">{procenat}%</span>
          </div>
          <div className="w-full h-3 bg-[#E3CAA5]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#AD8B73] transition-all duration-700 ease-out"
              style={{ width: `${procenat}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-2 rounded-3xl shadow-md border border-[#E3CAA5] h-fit">
          <h3 className="font-bold text-[#4a3f35] border-b border-[#E3CAA5] py-3 mb-2 text-center text-lg">
            Sadržaj kursa
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
            {lekcije.map((lekcija, index) => {
              const isAktivna = aktivnaLekcija.id === lekcija.id;
              const isZavrsena = zavrseneLekcije.includes(lekcija.id);

              return (
                <button
                  key={lekcija.id}
                  onClick={() => setAktivnaLekcija(lekcija)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-start gap-3 border-2 ${isAktivna
                    ? "bg-[#AD8B73] border-[#AD8B73] shadow-lg scale-[1.02] z-10"
                    : "bg-white border-transparent hover:border-[#E3CAA5] text-[#4a3f35]"
                    }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {isZavrsena ? (
                      <CheckCircle size={20} className={isAktivna ? "text-[#FFFBE9]" : "text-green-500"} />
                    ) : (
                      isAktivna ? (
                        <PlayCircle size={20} className="text-[#FFFBE9] animate-pulse" />
                      ) : (
                        <Circle size={20} className="text-[#E3CAA5]" />
                      )
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${isAktivna ? "text-[#FFFBE9]/80" : "text-[#AD8B73]"
                      }`}>
                      Lekcija {index + 1}
                    </div>
                    <div className={`font-bold text-sm leading-snug break-words ${isAktivna ? "text-white" : "text-[#4a3f35]"
                      }`}>
                      {lekcija.naziv}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}