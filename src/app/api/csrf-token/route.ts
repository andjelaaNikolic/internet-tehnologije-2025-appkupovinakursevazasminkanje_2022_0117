import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET() {
  const secret = process.env.CSRF_SECRET || 'neki_dugacki_nasumicni_string_za_csrf_zastitu_2025';
  const token = generateCsrfToken(secret);

  return NextResponse.json({ csrfToken: token });
}