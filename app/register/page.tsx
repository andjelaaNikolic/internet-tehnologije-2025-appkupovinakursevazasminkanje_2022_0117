"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    ime: "",
    prezime: "",
    email: "",
    lozinka: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!form.ime || !form.prezime || !form.email || !form.lozinka) {
      setErr("Sva polja su obavezna.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Neuspešna registracija");
      }

      // Ako je uspešno, šaljemo korisnika na login
      router.push("/login"); 
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black italic mb-2" style={{ color: "#AD8B73" }}>
            Pridruži se
          </h2>
          <p className="text-sm font-medium italic" style={{ color: "#CEAB93" }}>
            Kreiraj nalog i postani deo naše zajednice
          </p>
        </div>

        {err && <div className="auth-error-alert animate-pulse">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="auth-label">Ime</label>
              <input
                type="text"
                className="auth-input"
                value={form.ime}
                onChange={(e) => setForm({ ...form, ime: e.target.value })}
                placeholder="Ana"
                required
              />
            </div>
            <div>
              <label className="auth-label">Prezime</label>
              <input
                type="text"
                className="auth-input"
                value={form.prezime}
                onChange={(e) => setForm({ ...form, prezime: e.target.value })}
                placeholder="Anić"
                required
              />
            </div>
          </div>

          <div>
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@example.com"
              required
            />
          </div>

          <div>
            <label className="auth-label">Lozinka</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input pr-12"
                value={form.lozinka}
                onChange={(e) => setForm({ ...form, lozinka: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#CEAB93" }}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn mt-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Registruj se"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-[#E3CAA5]/30 pt-6">
          <p style={{ color: "#CEAB93" }}>
            Već imate nalog?{" "}
            <a href="/login" className="font-black underline decoration-2 underline-offset-4" style={{ color: "#AD8B73" }}>
              Prijavi se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}