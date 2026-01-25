"use client";

import React, { useState, useContext, FormEvent } from "react";
import { AuthContext } from "../komponente/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Uvezen Link
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function LoginPage() {
  const auth = useContext(AuthContext);
  const router = useRouter();

  const [form, setForm] = useState({ email: "", lozinka: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    
    if (!form.email.trim() || !form.lozinka.trim()) {
      setErr("Sva polja su obavezna.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("../api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Neuspešna prijava");
      }

      localStorage.setItem("token", data.token);

      if (auth) {
        auth.login(data.user, data.token);
      }

      router.push("/");
      router.refresh();

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
            Dobrodošli
          </h2>
          <p className="text-sm font-medium italic" style={{ color: "#CEAB93" }}>
            Prijavite se u svoj svet lepote
          </p>
        </div>

        {err && (
          <div className="auth-error-alert animate-pulse">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          <div>
            <label className="auth-label">Email</label>
            <input
              type="text"
              className="auth-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="npr. tijana_makeup"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 px-1">
              <label className="auth-label mb-0">Lozinka</label>
            </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#CEAB93" }}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Prijavi se"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-[#E3CAA5]/30 pt-6 flex flex-col gap-3">
          <p style={{ color: "#CEAB93" }}>
            Nemate nalog?{" "}
            <Link href="/register" className="font-black underline decoration-2 underline-offset-4" style={{ color: "#AD8B73" }}>
              Registrujte se
            </Link>
          </p>
          
          <Link href="/forgot-password" title="reset password" style={{ color: "#CEAB93" }} className="text-xs font-bold hover:underline italic">
            Zaboravljena lozinka?
          </Link>
        </div>

      </div>
    </div>
  );
}