import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GetKlijenti } from '@/app/api/edukator/klijenti/route';
import { GET as GetProdaja } from '@/app/api/edukator/prodaja/route';
import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  csrf: vi.fn((handler) => handler),
}));

vi.mock('@/db/index', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnValue([]),
    orderBy: vi.fn().mockReturnValue([]),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'tvoja_tajna_sifra_123';

const createValidToken = (uloga: string, sub: string = 'test-edukator-id') => {
  return jwt.sign(
    { sub, email: 'edukator@test.com', uloga },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

describe('API Edukator - Klijenti ruta', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treba da vrati 401 ako nema tokena u headeru ni u kuki', async () => {
    (headers as any).mockReturnValue(Promise.resolve(new Map()));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const req = new NextRequest('http://localhost:3000/api/edukator/klijenti');

    const response = await GetKlijenti(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Niste ulogovani.');
  });

  it('treba da vrati 401 ako je token nevalidan', async () => {
    const mockHeaders = new Map();
    mockHeaders.set('authorization', 'Bearer nevalidan-token');

    (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const req = new NextRequest('http://localhost:3000/api/edukator/klijenti');
    const response = await GetKlijenti(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Sesija nevažeća ili je istekla.');
  });

  it('treba da vrati 403 ako korisnik nije EDUKATOR', async () => {
    const token = createValidToken('KLIJENT');
    const mockHeaders = new Map();
    mockHeaders.set('authorization', `Bearer ${token}`);

    (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const req = new NextRequest('http://localhost:3000/api/edukator/klijenti');
    const response = await GetKlijenti(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Nemate pravo pristupa');
  });
});

describe('API Edukator - Prodaja ruta', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treba da vrati 401 ako nema tokena', async () => {
    (headers as any).mockReturnValue(Promise.resolve(new Map()));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const response = await GetProdaja();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Niste ulogovani.');
  });

  it('treba da vrati 401 ako je token nevalidan', async () => {
    const mockHeaders = new Map();
    mockHeaders.set('authorization', 'Bearer invalid-xyz');

    (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const response = await GetProdaja();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Sesija nevažeća.');
  });

  it('treba da vrati 403 ako korisnik nije EDUKATOR', async () => {
    const token = createValidToken('KLIJENT');
    const mockHeaders = new Map();
    mockHeaders.set('authorization', `Bearer ${token}`);

    (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const response = await GetProdaja();
    const body = await response.json();

    expect(response.status).toBe(403);
  });

  it('treba da vrati 200 sa podacima ako je EDUKATOR ulogovan', async () => {
    const token = createValidToken('EDUKATOR', 'edukator-123');
    const mockHeaders = new Map();
    mockHeaders.set('authorization', `Bearer ${token}`);

    (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
    (cookies as any).mockReturnValue(Promise.resolve({
      get: vi.fn().mockReturnValue(undefined)
    }));

    const response = await GetProdaja();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});