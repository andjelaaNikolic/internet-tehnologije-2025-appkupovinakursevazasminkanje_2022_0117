import { NextResponse } from "next/server";
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Odjava korisnika (Logout)
 *     description: Briše sesiju korisnika tako što poništava "auth" HTTP-only kolačić (cookie) postavljanjem njegovog trajanja na nulu.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Uspešna odjava. Kolačić je obrisan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
export async function POST() {
    const res = NextResponse.json({ ok: true });

    res.cookies.set("auth", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0)
    });

    return res;
}