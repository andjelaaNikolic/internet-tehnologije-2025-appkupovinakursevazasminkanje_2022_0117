// src/app/api/csrf-token/route.ts
import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf"; // tvoj helper

export async function GET() {
  // ❌ Ne prosleđujemo secret ovde
  const token = generateCsrfToken(); 

  return NextResponse.json({ csrfToken: token });
}