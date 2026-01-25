import { db } from "@/db";
import { korisnik } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { AUTH_COOKIE, cookieOpts, signAuthToken } from "@/lib/auth";


type Body = {
    ime: string;
    prezime: string;
    email: string;
    lozinka: string;
    
}

export async function POST(req: Request) {
    const { ime, prezime, email, lozinka } = (await req.json()) as Body;

    if (!ime || !prezime || !email || !lozinka) {
        return NextResponse.json({ error: "Nedostaju podaci" }, { status: 400 })
    }

    const exists = await db.select().from(korisnik).where(eq(korisnik.email, email));
    if (exists.length) {
        return NextResponse.json({ error: "Email postoji u bazi" }, { status: 400 })
    }

    const lozinkaHash = await bcrypt.hash(lozinka, 10);

    const [u] = await db.insert(korisnik)
        .values({ ime, prezime, email,lozinka:lozinkaHash, uloga: "KLIJENT" })
        .returning({ id: korisnik.id, ime: korisnik.ime, prezime: korisnik.prezime, email: korisnik.email })


    const punoIme = `${u.ime} ${u.prezime}`;
    const token = signAuthToken({ sub: u.id, email: u.email, punoIme: punoIme})
    const res = NextResponse.json(u)
    res.cookies.set(AUTH_COOKIE, token, cookieOpts());
    return res;

}