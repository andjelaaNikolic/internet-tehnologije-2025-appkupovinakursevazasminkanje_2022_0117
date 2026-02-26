"use client";

import RoleGuard from "../../components/RoleGuard";
import { useCart } from "../../context/KorpaContext";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ChevronLeft, CheckCircle, Loader2, ShoppingBag } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function KorpaContent() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const ukupno = cart.reduce((sum, item) => sum + Number(item.cena), 0);

  useEffect(() => {
    if (searchParams.get("success")) {
      clearCart();
    }
  }, [searchParams, clearCart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(
        "https://iteh-sminkanje-app.onrender.com/api/klijent/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ⚠️ šalje cookie za auth
          body: JSON.stringify({ items: cart }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Greška prilikom pokretanja plaćanja.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Stripe error:", error);
      alert("Došlo je do greške. Pokušajte ponovo.");
      setLoading(false);
    }
  };

  // ✅ Plaćanje uspešno
  if (searchParams.get("success")) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border-2 border-green-100 max-w-md">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={50} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-[--color-primary] uppercase tracking-tighter">Uplata Uspešna!</h1>
          <p className="text-gray-500 mb-8 font-medium">Hvala vam na poverenju. Vaši kursevi su obrađeni i dodati na vaš nalog.</p>
          <Link href="/stranice/kupljeni-kursevi" className="auth-btn !w-auto !px-10 shadow-lg">
            Gledaj moje kurseve
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Korpa prazna
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <ShoppingBag size={80} className="text-[--color-accent] mb-6 opacity-20" />
        <h1 className="text-3xl font-bold mb-4 text-[--color-primary]">Tvoja korpa je prazna</h1>
        <Link href="/stranice/svi-kursevi" className="auth-btn !w-auto !px-8 flex items-center gap-2">
          <ChevronLeft size={20} /> Istraži kurseve
        </Link>
      </div>
    );
  }

  // ✅ Glavna korpa
  return (
    <div className="min-h-screen bg-[#FFFBE9] p-4 md:p-12 animate-in fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-10 text-[--color-primary] uppercase tracking-tighter border-b-4 border-[--color-accent] inline-block">Tvoja Korpa</h1>

        <div className="auth-card !max-w-none !p-4 md:!p-10 shadow-2xl">
          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between border-b border-[--color-accent]/30 pb-6 gap-4">
                <div className="flex items-center gap-6 w-full text-left">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-[--color-accent] shadow-md flex-shrink-0">
                    <Image src={item.slika || "/placeholder.jpg"} alt={item.naziv} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[--color-text] leading-tight">{item.naziv}</h3>
                    <p className="text-[--color-primary] font-black text-lg mt-1">{item.cena} €</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-300 hover:text-red-500 p-2 transition-all hover:bg-red-50 rounded-full"
                  title="Ukloni iz korpe"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-[--color-accent]/10 rounded-[35px] border-2 border-dashed border-[--color-primary]/30 flex flex-col items-center">
            <div className="flex justify-between items-center w-full max-w-md mb-8">
              <span className="text-lg font-bold text-[--color-text] uppercase tracking-widest">Ukupno:</span>
              <span className="text-4xl font-black text-[--color-primary]">{ukupno} €</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="auth-btn !py-5 text-xl disabled:opacity-50 shadow-xl max-w-md flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" /> Povezivanje sa Stripe-om...
                </div>
              ) : (
                "POTVRDI I PLATI"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KorpaPage() {
  return (
    <RoleGuard allowedRoles={["KLIJENT"]}>
      <Suspense fallback={
        <div className="min-h-screen bg-[#FFFBE9] flex items-center justify-center">
          <Loader2 className="animate-spin text-[--color-primary]" size={48} />
        </div>
      }>
        <KorpaContent />
      </Suspense>
    </RoleGuard>
  );
}





/*"use client";

import RoleGuard from "../../components/RoleGuard";
import { useCart } from "../../context/KorpaContext";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ChevronLeft, CheckCircle, Loader2, ShoppingBag } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function KorpaContent() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const ukupno = cart.reduce((sum, item) => sum + Number(item.cena), 0);

  useEffect(() => {
    if (searchParams.get("success")) {
      clearCart();
    }
  }, [searchParams, clearCart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Greška prilikom pokretanja plaćanja.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Stripe error:", error);
      alert("Došlo je do greške. Pokušajte ponovo.");
      setLoading(false);
    }
  };

  if (searchParams.get("success")) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border-2 border-green-100 max-w-md">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={50} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-[--color-primary] uppercase tracking-tighter">Uplata Uspešna!</h1>
          <p className="text-gray-500 mb-8 font-medium">Hvala vam na poverenju. Vaši kursevi su obrađeni i dodati na vaš nalog.</p>
          <Link href="/stranice/kupljeni-kursevi" className="auth-btn !w-auto !px-10 shadow-lg">
            Gledaj moje kurseve
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFBE9] flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <ShoppingBag size={80} className="text-[--color-accent] mb-6 opacity-20" />
        <h1 className="text-3xl font-bold mb-4 text-[--color-primary]">Tvoja korpa je prazna</h1>
        <Link href="/stranice/svi-kursevi" className="auth-btn !w-auto !px-8 flex items-center gap-2">
          <ChevronLeft size={20} /> Istraži kurseve
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBE9] p-4 md:p-12 animate-in fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-10 text-[--color-primary] uppercase tracking-tighter border-b-4 border-[--color-accent] inline-block">Tvoja Korpa</h1>

        <div className="auth-card !max-w-none !p-4 md:!p-10 shadow-2xl">
          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between border-b border-[--color-accent]/30 pb-6 gap-4">
                <div className="flex items-center gap-6 w-full text-left">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-[--color-accent] shadow-md flex-shrink-0">
                    <Image src={item.slika || "/placeholder.jpg"} alt={item.naziv} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[--color-text] leading-tight">{item.naziv}</h3>
                    <p className="text-[--color-primary] font-black text-lg mt-1">{item.cena} €</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-300 hover:text-red-500 p-2 transition-all hover:bg-red-50 rounded-full"
                  title="Ukloni iz korpe"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-[--color-accent]/10 rounded-[35px] border-2 border-dashed border-[--color-primary]/30 flex flex-col items-center">
            <div className="flex justify-between items-center w-full max-w-md mb-8">
              <span className="text-lg font-bold text-[--color-text] uppercase tracking-widest">Ukupno:</span>
              <span className="text-4xl font-black text-[--color-primary]">{ukupno} €</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="auth-btn !py-5 text-xl disabled:opacity-50 shadow-xl max-w-md flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" /> Povezivanje sa Stripe-om...
                </div>
              ) : (
                "POTVRDI I PLATI"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KorpaPage() {
  return (
    <RoleGuard allowedRoles={["KLIJENT"]}>
      <Suspense fallback={
        <div className="min-h-screen bg-[#FFFBE9] flex items-center justify-center">
          <Loader2 className="animate-spin text-[--color-primary]" size={48} />
        </div>
      }>
        <KorpaContent />
      </Suspense>
    </RoleGuard>
  );
}
*/