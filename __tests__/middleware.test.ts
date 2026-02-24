/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';
import * as jose from 'jose';

const SECRET_STR = 'tvoja_tajna_sifra_123_duga_bar_32_karaktera';
process.env.JWT_SECRET = SECRET_STR;
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

const createToken = async (uloga: string, sub: string = 'user-123') => {
  const secret = new TextEncoder().encode(SECRET_STR);
  return await new jose.SignJWT({ sub, email: 'test@example.com', uloga })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
};

const createRequest = (
  pathname: string,
  method: string = 'GET',
  options: { token?: string; tokenInCookie?: boolean } = {}
) => {
  const url = new URL(`http://localhost:3000${pathname}`);
  const headers = new Headers();
  
  if (options.token && !options.tokenInCookie) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const req = new NextRequest(url, { 
    method,
    headers: headers
  });

  if (options.token && options.tokenInCookie) {
    req.cookies.set('auth', options.token);
  }

  return req;
};

describe('Middleware - Integracioni Testovi', () => {

  describe('Javne Rute', () => {
    it('Dozvoli /api/auth/login (status 200)', async () => {
      const req = createRequest('/api/auth/login', 'POST');
      const response = await middleware(req);
      expect(response?.status).toBe(200);
    });

    it('Dozvoli GET /api/kursevi svima', async () => {
      const req = createRequest('/api/kursevi', 'GET');
      const response = await middleware(req);
      expect(response?.status).toBe(200);
    });

    it('Zabrani POST /api/kursevi bez tokena (401)', async () => {
      const req = createRequest('/api/kursevi', 'POST');
      const response = await middleware(req);
      expect(response?.status).toBe(401);
    });
  });

  describe('Autentifikacija', () => {
    it('Vraća 401 za nevalidan token', async () => {
      const req = createRequest('/api/admin/korisnici', 'GET', {
        token: 'lazni-token'
      });
      const response = await middleware(req);
      expect(response?.status).toBe(401);
    });

    it('Prihvata validan token iz Authorization headera', async () => {
      const token = await createToken('ADMIN');
      const req = createRequest('/api/admin/korisnici', 'GET', { token });
      const response = await middleware(req);
      expect(response?.status).toBe(200);
    });
  });

  describe('Autorizacija po ulogama', () => {
    it('ADMIN ne može na /api/edukator (403)', async () => {
      const token = await createToken('ADMIN');
      const req = createRequest('/api/edukator/klijenti', 'GET', { token });
      const response = await middleware(req);
      expect(response?.status).toBe(403);
    });

    it('EDUKATOR ne može na /api/admin (403)', async () => {
      const token = await createToken('EDUKATOR');
      const req = createRequest('/api/admin/korisnici', 'GET', { token });
      const response = await middleware(req);
      expect(response?.status).toBe(403);
    });

    it('KLIJENT može na /api/klijent rute (200)', async () => {
      const token = await createToken('KLIJENT');
      const req = createRequest('/api/klijent/kupljeni-kursevi', 'GET', { token });
      const response = await middleware(req);
      expect(response?.status).toBe(200);
    });
  });

  describe('UI Zaštita (Redirects)', () => {
    it('Redirect sa /profil na /login ako nema tokena', async () => {
      const req = createRequest('/profil', 'GET');
      const response = await middleware(req);
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/login');
    });

    it('Redirect logovanog korisnika sa /login na /stranice/svi-kursevi', async () => {
      const token = await createToken('KLIJENT');
      const req = createRequest('/login', 'GET', { token, tokenInCookie: true });
      const response = await middleware(req);
      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/stranice/svi-kursevi');
    });
  });

  describe('Security Headers', () => {
    it('Provera bezbednosnih zaglavlja u odgovoru', async () => {
      const req = createRequest('/api/auth/login', 'POST');
      const response = await middleware(req);
      expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });
});