import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GetIzvestaji } from '@/app/api/admin/izvestaji/route';
import { GET as GetKorisnici } from '@/app/api/admin/korisnici/route';
import { POST as PostKorisnik } from '@/app/api/admin/korisnik/route';
import { GET as GetStatistikaProdaje } from '@/app/api/admin/statistika-prodaje/route';
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
        groupBy: vi.fn().mockReturnValue([]),
    },
}));

vi.mock('@/app/actions/admin', () => ({
    getMesecnaStatistikaKlijenata: vi.fn().mockResolvedValue({
        success: true,
        data: [
            { name: 'Jan 2024.', broj: 5 },
            { name: 'Feb 2024.', broj: 8 }
        ]
    }),
    getStatistikaProdajeKurseva: vi.fn().mockResolvedValue({
        success: true,
        data: [
            { naziv: 'Osnovi šminkanja', prihod: 1500, prodato: 10 },
            { naziv: 'Bridal makeup', prihod: 2000, prodato: 5 }
        ]
    }),
}));

vi.mock('@/app/actions/korisnik', () => ({
    dodajKorisnikaAction: vi.fn().mockResolvedValue({
        success: true,
        message: 'Korisnik je uspešno dodat.'
    }),
}));

const JWT_SECRET = process.env.JWT_SECRET || 'tvoja_tajna_sifra_123';

const createValidToken = (uloga: string, sub: string = 'test-admin-id') => {
    return jwt.sign(
        { sub, email: 'admin@test.com', uloga },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

describe('API Admin - Izveštaji (GET)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve(new Map()));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetIzvestaji();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani.');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        const mockHeaders = new Map();
        mockHeaders.set('authorization', 'Bearer invalid-token');

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetIzvestaji();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toContain('Sesija');
    });

    it('Trebalo bi vratiti 403 ako korisnik nije ADMIN', async () => {
        const token = createValidToken('KLIJENT');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetIzvestaji();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Zabranjen');
    });

    it('Trebalo bi vratiti 200 sa podacima ako je ADMIN ulogovan', async () => {
        const token = createValidToken('ADMIN');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetIzvestaji();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });
});

describe('API Admin - Korisnici (GET)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve(new Map()));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetKorisnici();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani.');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        const mockHeaders = new Map();
        mockHeaders.set('authorization', 'Bearer xyz-invalid');

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetKorisnici();
        const body = await response.json();

        expect(response.status).toBe(401);
    });

    it('Trebalo bi vratiti 403 ako korisnik nije ADMIN', async () => {
        const token = createValidToken('EDUKATOR');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetKorisnici();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Zabranjen');
    });

    it('Trebalo bi vratiti 200 sa listom korisnika', async () => {
        const token = createValidToken('ADMIN');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetKorisnici();
        const body = await response.json();

        expect(response.status).toBe(200);
    });
});

describe('API Admin - Dodaj Korisnika (POST)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve(new Map()));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/admin/korisnik', {
            method: 'POST',
            body: JSON.stringify({
                ime: 'Marko',
                prezime: 'Marković',
                email: 'marko@test.com',
                lozinka: 'Test123!',
                uloga: 'KLIJENT'
            }),
            headers: {
                'x-csrf-token': 'valid-csrf-token'
            }
        });

        const response = await PostKorisnik(req);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani.');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        const mockHeaders = new Map();
        mockHeaders.set('authorization', 'Bearer bad-token-here');

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/admin/korisnik', {
            method: 'POST',
            body: JSON.stringify({
                ime: 'Ana',
                prezime: 'Anić',
                email: 'ana@test.com',
                lozinka: 'Test123!',
                uloga: 'KLIJENT'
            }),
            headers: {
                'x-csrf-token': 'valid-csrf-token'
            }
        });

        const response = await PostKorisnik(req);
        const body = await response.json();

        expect(response.status).toBe(401);
    });

    it('Trebalo bi vratiti 403 ako korisnik nije ADMIN', async () => {
        const token = createValidToken('KLIJENT');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/admin/korisnik', {
            method: 'POST',
            body: JSON.stringify({
                ime: 'Petar',
                prezime: 'Petrović',
                email: 'petar@test.com',
                lozinka: 'Test123!',
                uloga: 'KLIJENT'
            }),
            headers: {
                'x-csrf-token': 'valid-csrf-token'
            }
        });

        const response = await PostKorisnik(req);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Zabranjen');
    });

    it('Trebalo bi vratiti 200 ako je ADMIN ulogovan i validni su podaci', async () => {
        const token = createValidToken('ADMIN');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/admin/korisnik', {
            method: 'POST',
            body: JSON.stringify({
                ime: 'Jelena',
                prezime: 'Jelenić',
                email: 'jelena@test.com',
                lozinka: 'Test123!',
                uloga: 'EDUKATOR'
            }),
            headers: {
                'x-csrf-token': 'valid-csrf-token'
            }
        });

        const response = await PostKorisnik(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
    });
});

describe('API Admin - Statistika Prodaje (GET)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve(new Map()));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetStatistikaProdaje();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani.');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        const mockHeaders = new Map();
        mockHeaders.set('authorization', 'Bearer wrong-secret');

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetStatistikaProdaje();
        const body = await response.json();

        expect(response.status).toBe(401);
    });

    it('Trebalo bi vratiti 403 ako korisnik nije ADMIN', async () => {
        const token = createValidToken('EDUKATOR');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetStatistikaProdaje();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toContain('Zabranjen');
    });

    it('Trebalo bi vratiti 200 sa statistikom ako je ADMIN ulogovan', async () => {
        const token = createValidToken('ADMIN');
        const mockHeaders = new Map();
        mockHeaders.set('authorization', `Bearer ${token}`);

        (headers as any).mockReturnValue(Promise.resolve(mockHeaders));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const response = await GetStatistikaProdaje();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });
});
