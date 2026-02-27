import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Niste ulogovani." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded || decoded.uloga !== "ADMIN") {
      return NextResponse.json({ message: "Pristup dozvoljen samo administratorima." }, { status: 403 });
    }

    return NextResponse.json({ 
      data: { reports: [] }, 
      message: "Uspeh" 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Greška na serveru." }, { status: 500 });
  }
}