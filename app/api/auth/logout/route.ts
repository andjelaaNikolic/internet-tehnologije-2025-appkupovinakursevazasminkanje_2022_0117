import { AUTH_COOKIE } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
    const res = NextResponse.json({ ok: true })

    res.cookies.set(AUTH_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0) 
    })

    return res;
}