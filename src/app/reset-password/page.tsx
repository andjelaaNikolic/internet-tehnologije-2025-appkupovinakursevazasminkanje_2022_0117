"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-wrap flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[#AD8B73]" size={48} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const [novaLozinka, setNovaLozinka] = useState("");
  const [potvrda, setPotvrda] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!token) {
      setErr("Token nedostaje. Molimo vas koristite link iz email-a.");
      return;
    }

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
        body: JSON.stringify({ token, novaLozinka }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Greška pri ažuriranju.");
      }

      setShowSuccess(true);
    } catch (error: any) {
      setErr(error.message || "Došlo je do greške.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowSuccess(false);
    router.push("/login");
  };

  if (!token) {
    return (
      <div className="auth-wrap">
        <div className="auth-card text-center">
          <p className="text-red-500 mb-4 font-bold">
            Nevažeći ili nepostojeći link za resetovanje lozinke.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="auth-btn"
          >
            Nazad na prijavu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-sm p-4">
          <div className="auth-card flex flex-col items-center text-center max-w-sm">
            <div className="bg-green-100 text-green-500 p-3 rounded-full mb-4">
              <CheckCircle size={48} />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#AD8B73" }}
            >
              Lozinka je promenjena!
            </h2>
            <p className="text-sm font-medium mb-6 text-gray-600">
              Vaša lozinka je uspešno promenjena. Sada se možete prijaviti.
            </p>
            <button onClick={handleGoToLogin} className="auth-btn !mt-0">
              Idi na prijavu
            </button>
          </div>
        </div>
      )}

      <div className="auth-card">
        <div className="mb-8 text-center">
          <h2
            className="playfair text-3xl font-black italic mb-2"
            style={{ color: "#AD8B73" }}
          >
            Nova Lozinka
          </h2>
          <p
            className="text-sm font-medium italic"
            style={{ color: "#CEAB93" }}
          >
            Postavite novu lozinku za vaš nalog
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
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={24} />
            ) : (
              "Sačuvaj novu lozinku"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}