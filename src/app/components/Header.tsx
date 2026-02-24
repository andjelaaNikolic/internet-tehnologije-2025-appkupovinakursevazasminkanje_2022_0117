"use client";

import Link from "next/link";
import Image from "next/image";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const uloga = user?.uloga;

  const linkStyle = "nav-link text-lg font-medium hover:opacity-80 transition-all";

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="Logo" width={80} height={80} />
        </Link>

        <div className="nav-links">

          {!user && (
            <>
              <Link href="/login" className={linkStyle}>Prijava</Link>
              <Link href="/register" className={linkStyle}>Registracija</Link>
              <Link href="/stranice/o-meni" className={linkStyle}>O meni</Link>
              <Link href="/stranice/kontakt" className={linkStyle}>Kontakt</Link>
            </>
          )}


          {uloga === "KLIJENT" && (
            <>
              <Link href="/stranice/svi-kursevi" className={linkStyle}>Kursevi</Link>
              <Link href="/stranice/kupljeni-kursevi" className={linkStyle}>Kupljeni kursevi</Link>

              <Link href="/stranice/korpa" className="nav-link">
                <Image src="/korpa3.png" alt="Korpa" width={40} height={40} />
              </Link>

              <Link href="/stranice/o-meni" className={linkStyle}>O meni</Link>
              <Link href="/stranice/kontakt" className={linkStyle}>Kontakt</Link>
              <button onClick={logout} className={`${linkStyle} logout-btn`}>Logout</button>
            </>
          )}

          {uloga === "EDUKATOR" && (
            <>
              <Link href="/stranice/pregled-klijenata" className={linkStyle}>Klijenti</Link>
              <Link href="/stranice/svi-kursevi" className={linkStyle}>Kursevi</Link>
              <Link href="/stranice/dodaj-kurs" className={linkStyle}>Dodaj kurs</Link>
              <Link href="/stranice/brisanje-kurseva" className={linkStyle}>Obriši kurs</Link>
              <Link href="/stranice/promena-kurseva" className={linkStyle}>Promeni kurs</Link>
              <Link href="/stranice/pregled-prodaje-kurseva" className={linkStyle}>Pregled prodaje</Link>
              <button onClick={logout} className={`${linkStyle} logout-btn`}>Logout</button>
            </>
          )}

          {uloga === "ADMIN" && (
            <>
              <Link href="/stranice/pregled-korisnika" className={linkStyle}>Korisnici</Link>
              <Link href="/stranice/dodaj-korisnika" className={linkStyle}>Dodaj korisnika</Link>
              <Link href="/stranice/mesecni-izvestaji" className={linkStyle}>Mesečni izveštaji o klijentima</Link>
              <Link href="/stranice/statistika-prodaje" className={linkStyle}>Statistika prodaje</Link>
              <button onClick={logout} className={`${linkStyle} logout-btn`}>Logout</button>
            </>
          )}


        </div>
      </nav>
    </header>
  );
}