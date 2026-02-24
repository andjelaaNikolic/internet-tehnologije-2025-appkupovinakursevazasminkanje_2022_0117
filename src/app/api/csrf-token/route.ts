import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.NEXT_PUBLIC_CSRF_SECRET || process.env.CSRF_SECRET || '';
  return NextResponse.json({ csrfToken: token });
}
