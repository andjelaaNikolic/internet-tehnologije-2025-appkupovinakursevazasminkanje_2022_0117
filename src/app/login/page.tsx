"use client";

import React, { useState, useContext, FormEvent, Suspense } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-wrap flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[--color-primary]" size={48} />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ email: "", lozinka: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // Učitaj CSRF token i pošalji u headeru
      const tokenRes = await fetch('/api/csrf-token');
      const tokenData = await tokenRes.json();
      const csrfToken = tokenData.csrfToken;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Neuspešna prijava");

      if (auth) auth.login(data.user, data.token);

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        if (data.user.uloga === "EDUKATOR") {
          router.push("/stranice/pregled-klijenata");
        } else if (data.user.uloga === "KLIJENT") {
          router.push("/stranice/svi-kursevi");
        } else {
          router.push("/");
        }
      }
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
          <h2 className="text-4xl font-black italic mb-2 text-[#AD8B73]">Dobrodošli</h2>
          <p className="text-sm font-medium italic text-[#CEAB93]">Prijavite se u svet lepote</p>
        </div>

        {err && <div className="auth-error-alert">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@gmail.com"
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

            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-xs font-bold hover:underline"
                style={{ color: "#AD8B73" }}
              >
                Zaboravili ste lozinku?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? (
              <Loader2 className="animate-spin mx-auto text-white" size={24} />
            ) : (
              "Prijavi se"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm border-t border-[#E3CAA5]/30 pt-6">
          <p style={{ color: "#CEAB93" }}>
            Nemate nalog?{" "}
            <Link
              href="/register"
              className="font-black underline decoration-2 underline-offset-4 text-[#AD8B73]"
            >
              Registrujte se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}