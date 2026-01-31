"use client";

import { useState } from "react";
import { Mail, BookOpen } from "lucide-react";

interface Klijent {
  korisnikId: string;
  ime: string;
  prezime: string;
  email: string;
  brojKurseva: number;
}

interface Props {
  klijenti: Klijent[];
}

export default function PretragaKlijenata({ klijenti }: Props) {
  const [query, setQuery] = useState("");

  const filtrirani = klijenti.filter(
    (k) =>
      k.ime.toLowerCase().includes(query.toLowerCase()) ||
      k.prezime.toLowerCase().includes(query.toLowerCase()) ||
      k.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Pretraži po imenu, prezimenu ili emailu..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-4 rounded-3xl border-2 border-[#E3CAA5] focus:outline-none focus:ring-2 focus:ring-[#AD8B73] bg-white placeholder:text-[#AD8B73] text-[#4a3f35] font-medium"
     />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#AD8B73] text-white">
              <th className="p-5 font-bold uppercase text-sm tracking-wider">Klijent</th>
              <th className="p-5 font-bold uppercase text-sm tracking-wider">Kontakt</th>
              <th className="p-5 font-bold uppercase text-sm tracking-wider text-center">Broj kurseva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3CAA5]">
            {filtrirani.map((k) => (
              <tr key={k.korisnikId} className="hover:bg-[#FFFBE9]/50 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E3CAA5] rounded-full flex items-center justify-center text-[#AD8B73] font-bold">
                      {k.ime[0]}{k.prezime[0]}
                    </div>
                    <span className="font-bold text-[#4a3f35]">{k.ime} {k.prezime}</span>
                  </div>
                </td>

                <td className="p-5">
                  <div className="flex items-center gap-2 text-[#AD8B73]">
                    <Mail size={16} />
                    <span className="text-sm">{k.email}</span>
                  </div>
                </td>

                <td className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen size={16} className="text-[#AD8B73]" />
                    <span className="font-medium text-[#4a3f35]">{k.brojKurseva}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
