"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [novaLozinka, setNovaLozinka] = useState("");
  const [potvrda, setPotvrda] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (novaLozinka.length < 6) {
      setErr("Lozinka mora imati barem 6 karaktera.");
      return;
    }

    if (novaLozinka !== potvrda) {
      setErr("Lozinke se ne podudaraju!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, novaLozinka }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Greška pri ažuriranju.");

      alert("Lozinka uspešno promenjena!");
      router.push("/login");
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-wrap">
        <div className="auth-card text-center">
          <p className="text-red-500 mb-4">Nevažeći link za resetovanje lozinke.</p>
          <button onClick={() => router.push("/login")} className="auth-btn">Nazad na prijavu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="mb-8 text-center">
          <h2 className="playfair text-3xl font-black italic mb-2" style={{ color: "#AD8B73" }}>
            Nova Lozinka
          </h2>
          <p className="text-sm font-medium italic" style={{ color: "#CEAB93" }}>
            Postavite novu lozinku za nalog: <br/><strong>{email}</strong>
          </p>
        </div>
        
        {err && <div className="auth-error-alert">{err}</div>}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="auth-label">Nova lozinka</label>
            <input
              type="password"
              className="auth-input"
              value={novaLozinka}
              onChange={(e) => setNovaLozinka(e.target.value)}
              placeholder="Min. 6 karaktera"
              required
            />
          </div>
          <div>
            <label className="auth-label">Potvrdite lozinku</label>
            <input
              type="password"
              className="auth-input"
              value={potvrda}
              onChange={(e) => setPotvrda(e.target.value)}
              placeholder="Ponovite lozinku"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Čuvanje..." : "Sačuvaj novu lozinku"}
          </button>
        </form>
      </div>
    </div>
  );
}
