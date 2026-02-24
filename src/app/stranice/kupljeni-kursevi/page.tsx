"use client";

import RoleGuard from "../../components/RoleGuard";
import KupljeniKurseviContent from "../../components/KupljeniKurseviContent";
import { escapeHtml } from "../../utils/sanitize";
import { useEffect, useState, Suspense } from "react";
import { fetchKupljeniKursevi } from "@/lib/kupljeniKurseviClient";
import { Loader2 } from "lucide-react";

function MojiKurseviSadrzaj() {
  const [kursevi, setKursevi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchKupljeniKursevi();
        if (res.success) {
          setKursevi(res.data || []);
        } else {
          setError(res.error || "Greška pri učitavanju kurseva.");
        }
      } catch (err: any) {
        setError(err?.message || "Greška na serveru.");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <KupljeniKurseviContent
      pocetniKursevi={kursevi}
      loading={loading}
      error={error}
    />
  );
}

export default function MojiKurseviPage() {
  return (
    <RoleGuard allowedRoles={["KLIJENT"]}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFBE9]">
            <Loader2 className="animate-spin text-[--color-primary]" size={50} />
            <p className="mt-4 font-bold italic text-[--color-primary]">Učitavanje vaših kurseva...</p>
          </div>
        }
      >
        <MojiKurseviSadrzaj />
      </Suspense>
    </RoleGuard>
  );
}