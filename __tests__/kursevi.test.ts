import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as listKursevi } from '@/app/api/kursevi/route';
import { GET as getKursDetalji, PATCH as updateKurs, DELETE as deleteKurs } from '@/app/api/kursevi/[id]/route';
import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super_tajni_string_123';
const CSRF_SECRET = 'csrf-tajna-123';
process.env.JWT_SECRET = JWT_SECRET;
process.env.CSRF_SECRET = CSRF_SECRET;

vi.mock('next/headers', () => ({
    headers: vi.fn(),
    cookies: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
    csrf: vi.fn((handler) => handler),
}));

vi.mock('@/db/index', () => {
    const mockKurs = {
        id: 'kurs-123',
        naziv: 'Test Kurs',
        edukator: 'user-123',
        cena: '50',
        slika: '/img.jpg'
    };

    const dbMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve([mockKurs]).then(resolve),
        transaction: vi.fn(async (cb) => {
            const txMock = {
                update: vi.fn().mockReturnThis(),
                set: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                then: (res: any) => res([{ id: '1' }]),
            };
            return await cb(txMock);
        }),
        query: {
            kurs: {
                findFirst: vi.fn().mockResolvedValue(mockKurs)
            }
        }
    };
    return { db: dbMock };
});

const createToken = (uloga: string, sub: string = 'user-123') => {
    return jwt.sign({ sub, uloga }, JWT_SECRET);
};

describe('Integracioni Testovi - Kursevi API', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/kursevi', () => {
        it('GOST/KLIJENT: treba da vidi listu svih kurseva (200 OK)', async () => {
            (headers as any).mockReturnValue(Promise.resolve({ get: () => null }));
            (cookies as any).mockReturnValue(Promise.resolve({ get: () => null }));

            const response = await (listKursevi as any)();
            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/kursevi/[id]', () => {
        const params = Promise.resolve({ id: 'kurs-123' });

        it('GOST: treba da vidi detalje ali jeKupljen treba biti false', async () => {
            (headers as any).mockReturnValue(Promise.resolve({ get: () => null }));
            (cookies as any).mockReturnValue(Promise.resolve({ get: () => null }));

            const req = new NextRequest('http://localhost:3000/api/kursevi/kurs-123');
            const response = await (getKursDetalji as any)(req, { params });
            const body = await response.json();

            expect(body.kurs.jeKupljen).toBe(false);
        });

        it('VLASNIK: treba da ima potpun pristup (jeKupljen: true)', async () => {
            const token = createToken('EDUKATOR', 'user-123');
            (headers as any).mockReturnValue(Promise.resolve({
                get: (n: string) => n === 'authorization' ? `Bearer ${token}` : null
            }));

            const req = new NextRequest('http://localhost:3000/api/kursevi/kurs-123', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const response = await (getKursDetalji as any)(req, { params });
            const body = await response.json();

            expect(body.kurs.jeKupljen).toBe(true);
        });
    });

    describe('PATCH /api/kursevi/[id]', () => {
        const params = Promise.resolve({ id: 'kurs-123' });

        it('TUĐI KURS: Edukator ne sme da menja tuđi kurs (403)', async () => {
            const token = createToken('EDUKATOR', 'neko-drugi');
            (headers as any).mockReturnValue(Promise.resolve({
                get: (n: string) => n === 'authorization' ? `Bearer ${token}` : CSRF_SECRET
            }));

            const req = new NextRequest('http://localhost:3000/api/kursevi/kurs-123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-csrf-token': CSRF_SECRET
                },
                body: JSON.stringify({ naziv: 'Hakovano' })
            });

            const response = await (updateKurs as any)(req, { params });
            expect(response.status).toBe(403);
        });

        it('VLASNIK KURS: Dozvoljava izmenu sopstvenog kursa (200 OK)', async () => {
            const token = createToken('EDUKATOR', 'user-123');
            (headers as any).mockReturnValue(Promise.resolve({
                get: (n: string) => n === 'authorization' ? `Bearer ${token}` : CSRF_SECRET
            }));

            const req = new NextRequest('http://localhost:3000/api/kursevi/kurs-123', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-csrf-token': CSRF_SECRET
                },
                body: JSON.stringify({ naziv: 'Novi Naziv', cena: 60, lekcije: [] })
            });

            const response = await (updateKurs as any)(req, { params });
            expect(response.status).toBe(200);
        });
    });

    describe('DELETE /api/kursevi/[id]', () => {
        const params = Promise.resolve({ id: 'kurs-123' });

        it('NEULOGOVAN: Ne sme se brisati bez tokena (401)', async () => {
            (headers as any).mockReturnValue(Promise.resolve({ get: () => null }));

            const req = new NextRequest('http://localhost:3000/api/kursevi/kurs-123', {
                method: 'DELETE',
                headers: { 'x-csrf-token': CSRF_SECRET }
            });
            const response = await (deleteKurs as any)(req, { params });
            expect(response.status).toBe(401);
        });
    });
});