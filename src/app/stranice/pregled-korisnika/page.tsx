"use client";

import React, { useState, useEffect, useContext } from "react";
import { Mail, User as UserIcon, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

interface Korisnik {
  id: string;
  ime: string;
  prezime: string;
  email: string;
  uloga: "KLIJENT" | "EDUKATOR" | "ADMIN";
}

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!allowedRoles.includes(user.uloga)) router.push("/");
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) return <div className="flex justify-center items-center h-screen">Učitavanje...</div>;
  if (!user || !allowedRoles.includes(user.uloga)) return null;

  return <>{children}</>;
}

export default function PregledKorisnikaPage() {
  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();


  useEffect(() => {
    async function fetchKorisnici() {
      try {
        const res = await fetch("/api/korisnici"); 
        const data: Korisnik[] = await res.json();
        setKorisnici(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchKorisnici();
  }, []);

  const filtrirani = korisnici.filter(
    (k) =>
      k.ime.toLowerCase().includes(query.toLowerCase()) ||
      k.prezime.toLowerCase().includes(query.toLowerCase()) ||
      k.email.toLowerCase().includes(query.toLowerCase())
  );

  
  const edukatori = filtrirani.filter(k => k.uloga === "EDUKATOR");
  const admini = filtrirani.filter(k => k.uloga === "ADMIN");
  const klijenti = filtrirani.filter(k => k.uloga === "KLIJENT");

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-[#FFFBE9] p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-[#4a3f35] mb-2">Pregled korisnika</h1>
            <p className="text-[#AD8B73] font-medium">Spisak svih registrovanih korisnika.</p>
          </header>

          <input
            type="text"
            placeholder="Pretraži po imenu, prezimenu ili emailu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 rounded-3xl border-2 border-[#E3CAA5] focus:outline-none focus:ring-2 focus:ring-[#AD8B73] bg-white placeholder:text-[#AD8B73] text-[#4a3f35] font-medium"
          />

          
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[#E3CAA5]">
            <h2 className="text-2xl font-bold text-[#4a3f35] mb-4">Edukatori</h2>
            {edukatori.length === 0 ? (
              <p className="text-[#AD8B73]">Nema edukatora u sistemu.</p>
              ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#AD8B73] text-white">
                    <th className="p-4 font-bold uppercase text-sm w-3/5">Korisnik</th>
                    <th className="p-4 font-bold uppercase text-sm w-2/5">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3CAA5]">
                  {edukatori.map((k) => (
                    <tr key={k.id} className="hover:bg-[#FFFBE9]/50 transition-colors">
                      <td className="p-4 flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-[#E3CAA5] rounded-full flex items-center justify-center text-[#AD8B73] font-bold flex-none">
                          {k.ime[0]}{k.prezime[0]}
                        </div>
                        <span className="font-medium text-[#4a3f35] truncate">{k.ime} {k.prezime}</span>
                      </td>
                      <td className="p-4 text-[#AD8B73]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-none"><Mail size={16} /></div>
                          <div className="truncate">{k.email}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[#E3CAA5]">
            <h2 className="text-2xl font-bold text-[#4a3f35] mb-4">Administratori</h2>
            {admini.length === 0 ? (
              <p className="text-[#AD8B73]">Nema administratora u sistemu.</p>
              ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#4a5568] text-white">
                    <th className="p-4 font-bold uppercase text-sm w-3/5">Korisnik</th>
                    <th className="p-4 font-bold uppercase text-sm w-2/5">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3CAA5]">
                  {admini.map((k) => (
                    <tr key={k.id} className="hover:bg-[#FFFBE9]/50 transition-colors">
                      <td className="p-4 flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-[#E3CAA5] rounded-full flex items-center justify-center text-[#AD8B73] font-bold flex-none">
                          {k.ime[0]}{k.prezime[0]}
                        </div>
                        <span className="font-medium text-[#4a3f35] truncate">{k.ime} {k.prezime}</span>
                      </td>
                      <td className="p-4 text-[#AD8B73]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-none"><Mail size={16} /></div>
                          <div className="truncate">{k.email}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          
          <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[#E3CAA5]">
            <h2 className="text-2xl font-bold text-[#4a3f35] mb-4">Klijenti</h2>
            {klijenti.length === 0 ? (
              <p className="text-[#AD8B73]">Nema registrovanih klijenata.</p>
              ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#E3CAA5] text-[#4a3f35]">
                    <th className="p-4 font-bold uppercase text-sm w-3/5">Korisnik</th>
                    <th className="p-4 font-bold uppercase text-sm w-2/5">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3CAA5]">
                  {klijenti.map((k) => (
                    <tr key={k.id} className="hover:bg-[#FFFBE9]/50 transition-colors">
                      <td className="p-4 flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-[#AD8B73] rounded-full flex items-center justify-center text-white font-bold flex-none">
                          {k.ime[0]}{k.prezime[0]}
                        </div>
                        <span className="font-medium text-[#4a3f35] truncate">{k.ime} {k.prezime}</span>
                      </td>
                      <td className="p-4 text-[#AD8B73]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-none"><Mail size={16} /></div>
                          <div className="truncate">{k.email}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
