
"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Greška pri slanju.");

      setMessage("Link za promenu lozinke je poslat na vaš email!");
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
          <h2 className="playfair text-3xl font-black italic mb-2" style={{ color: "#AD8B73" }}>
            Zaboravljena lozinka
          </h2>
          <p className="text-sm font-medium italic" style={{ color: "#CEAB93" }}>
            Unesite email da biste resetovali lozinku
          </p>
        </div>

        {err && <div className="auth-error-alert">{err}</div>}
        {message && (
          <div className="p-3 bg-green-100 text-green-700 text-sm rounded-lg mb-4 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="auth-label">Vaš Email</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="npr. ana@gmail.com"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Slanje..." : "Pošalji link"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-[#f7edeb] pt-6">
          <Link href="/login" className="text-sm font-bold hover:underline" style={{ color: "#AD8B73" }}>
            Vrati se na prijavu
          </Link>
        </div>
      </div>
    </div>
  );
}
