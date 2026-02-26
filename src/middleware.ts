import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  let token: string | undefined;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    token = request.cookies.get("auth")?.value;
  }


  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  const isProtectedRoute = pathname.startsWith("/stranice/dodaj-kurs") || pathname.startsWith("/profil");
  const isLoginPage = pathname === "/login";

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/stranice/svi-kursevi", request.url));
  }

  if (pathname.startsWith('/api')) {

    if (pathname.startsWith('/api/auth') || pathname === '/api/webhook' || pathname === '/api/csrf-token') {
      return addSecurityHeaders(NextResponse.next());
    }

    if (pathname.startsWith('/api/kursevi') && method === 'GET') {
      return addSecurityHeaders(NextResponse.next());
    }

    if (!token) {
      return addSecurityHeaders(NextResponse.json({ message: 'Niste ulogovani' }, { status: 401 }));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const uloga = payload.uloga as string;


      if ((pathname.startsWith('/api/admin') || pathname.startsWith('/api/api-doc')) && uloga !== 'ADMIN') {
        return addSecurityHeaders(NextResponse.json({ message: 'Pristup dozvoljen samo administratorima' }, { status: 403 }));
      }

      if (pathname.startsWith('/api/edukator') && uloga !== 'EDUKATOR') {
        return addSecurityHeaders(NextResponse.json({ message: 'Pristup dozvoljen samo edukatorima' }, { status: 403 }));
      }

      if (pathname.startsWith('/api/klijent') && uloga !== 'KLIJENT') {
        return addSecurityHeaders(NextResponse.json({ message: 'Pristup dozvoljen samo klijentima' }, { status: 403 }));
      }

      return addSecurityHeaders(NextResponse.next());

    } catch (error) {
      return addSecurityHeaders(NextResponse.json({ message: 'Sesija nevažeća ili je istekla' }, { status: 401 }));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}


function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  const allowedOrigin = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');

  return response;
}

export const config = {
  matcher: [
    "/stranice/dodaj-kurs/:path*",
    "/profil/:path*",
    "/login",
    "/api/:path*"
  ],
};



