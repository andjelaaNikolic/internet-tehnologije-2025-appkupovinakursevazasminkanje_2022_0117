/*import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as PostCheckout } from '@/app/api/klijent/checkout/route';
import { GET as GetKupljeniKursevi } from '@/app/api/klijent/kupljeni-kursevi/route';
import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'tvoja_tajna_sifra_123';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

const JWT_SECRET = 'tvoja_tajna_sifra_123';

vi.mock('next/headers', () => ({
    headers: vi.fn(),
    cookies: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
    csrf: vi.fn((handler) => handler),
}));

vi.mock('stripe', () => {
    const StripeMock = vi.fn().mockImplementation(function (this: any) {
        this.checkout = {
            sessions: {
                create: vi.fn().mockResolvedValue({
                    url: 'https://checkout.stripe.com/pay/cs_test_123456'
                })
            }
        };
    });
    return { default: StripeMock };
});

vi.mock('@/db/index', () => {
    const internalMockData = [
        {
            id: 'kurs-1',
            naziv: 'Osnovi šminkanja',
            cena: '49.99',
            slika: 'https://example.com/slika.jpg',
            opis: 'Osnovni kurs',
            kategorija: 'makeup',
            edukatorIme: 'Ana',
            edukatorPrezime: 'Anić',
            edukator: 'edu-1'
        },
        {
            id: 'kurs-2',
            naziv: 'Bridal makeup',
            cena: '79.99',
            slika: 'https://example.com/slika2.jpg',
        }
    ];

    const internalDbMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (onFulfilled: any) => Promise.resolve(internalMockData).then(onFulfilled),
    };

    return { db: internalDbMock };
});

const createValidToken = (uloga: string, sub: string = 'test-klijent-id') => {
    return jwt.sign(
        { sub, email: 'klijent@test.com', uloga },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

describe('API Klijent - Kupljeni Kursevi (GET)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(null)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/kupljeni-kursevi');
        const response = await (GetKupljeniKursevi as any)(req);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani.');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue('Bearer invalid-token')
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/kupljeni-kursevi');
        const response = await (GetKupljeniKursevi as any)(req);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toContain('Sesija');
    });

    it('Trebalo bi vratiti 200 sa listom kurseva ako je KLIJENT ulogovan', async () => {
        const token = createValidToken('KLIJENT');
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(`Bearer ${token}`)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/kupljeni-kursevi');
        const response = await (GetKupljeniKursevi as any)(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('Trebalo bi vratiti 200 sa listom kurseva ako je ADMIN ulogovan', async () => {
        const token = createValidToken('ADMIN');
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(`Bearer ${token}`)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/kupljeni-kursevi');
        const response = await (GetKupljeniKursevi as any)(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
    });
});

describe('API Klijent - Checkout (POST)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Trebalo bi vratiti 401 ako nema tokena', async () => {
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(null)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/checkout', {
            method: 'POST',
            body: JSON.stringify({
                items: [{ id: 'kurs-1' }, { id: 'kurs-2' }]
            })
        });

        const response = await (PostCheckout as any)(req);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe('Niste ulogovani');
    });

    it('Trebalo bi vratiti 401 ako je token nevalidan', async () => {
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue('Bearer bad-token')
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/checkout', {
            method: 'POST',
            body: JSON.stringify({
                items: [{ id: 'kurs-1' }]
            })
        });

        const response = await (PostCheckout as any)(req);
        const body = await response.json();

        expect(response.status).toBe(401);
    });

    it('Trebalo bi vratiti 400 ako je korpa prazna', async () => {
        const token = createValidToken('KLIJENT');
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(`Bearer ${token}`)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/checkout', {
            method: 'POST',
            body: JSON.stringify({
                items: []
            })
        });

        const response = await (PostCheckout as any)(req);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain('Korpa');
    });

    it('Trebalo bi vratiti 200 sa checkout URL ako je KLIJENT ulogovan', async () => {
        const token = createValidToken('KLIJENT', 'klijent-123');
        (headers as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(`Bearer ${token}`)
        }));
        (cookies as any).mockReturnValue(Promise.resolve({
            get: vi.fn().mockReturnValue(undefined)
        }));

        const req = new NextRequest('http://localhost:3000/api/klijent/checkout', {
            method: 'POST',
            body: JSON.stringify({
                items: [
                    { id: 'kurs-1' },
                    { id: 'kurs-2' }
                ]
            })
        });

        const response = await (PostCheckout as any)(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.url).toBeDefined();
        expect(body.url).toContain('checkout.stripe.com');
    });
});
*/
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as PostCheckout } from "@/app/api/klijent/checkout/route";
import { GET as GetKupljeniKursevi } from "@/app/api/klijent/kupljeni-kursevi/route";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "tvoja_tajna_sifra_123";

const JWT_SECRET = process.env.JWT_SECRET!;

// Mock headers/cookies (NextRequest ih koristi interno)
vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@/lib/csrf", () => ({
  csrf: vi.fn((handler) => handler),
}));

// Mock Stripe
vi.mock("stripe", () => {
  const StripeMock = vi.fn().mockImplementation(function (this: any) {
    this.checkout = {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_123456" }),
      },
    };
  });
  return { default: StripeMock };
});

// Mock baza
vi.mock("@/db/index", () => {
  const kursevi = [
    { id: "kurs-1", naziv: "Osnovi šminkanja", cena: "49.99" },
    { id: "kurs-2", naziv: "Bridal makeup", cena: "79.99" },
  ];

  const dbMock = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    then: (onFulfilled: any) => Promise.resolve(kursevi).then(onFulfilled),
  };

  return { db: dbMock };
});

// Helper za generisanje JWT tokena
const createToken = (uloga: string, sub: string = "klijent-123") =>
  jwt.sign({ sub, email: "klijent@test.com", uloga }, JWT_SECRET, { expiresIn: "1h" });

describe("API Klijent - Kupljeni Kursevi (GET)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 ako nema tokena", async () => {
    const req = new NextRequest("http://localhost:3000/api/klijent/kupljeni-kursevi");
    const res = await (GetKupljeniKursevi as any)(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Niste ulogovani.");
  });

  it("403 ako nije KLIJENT", async () => {
    const token = createToken("ADMIN");
    const req = new NextRequest("http://localhost:3000/api/klijent/kupljeni-kursevi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await (GetKupljeniKursevi as any)(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe("Pristup dozvoljen samo klijentima.");
  });

  it("200 ako je KLIJENT", async () => {
    const token = createToken("KLIJENT");
    const req = new NextRequest("http://localhost:3000/api/klijent/kupljeni-kursevi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await (GetKupljeniKursevi as any)(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true); // zavisi od tvoje rute
  });
});

describe("API Klijent - Checkout (POST)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 ako nema tokena", async () => {
    const req = new NextRequest("http://localhost:3000/api/klijent/checkout", {
      method: "POST",
      body: JSON.stringify({ items: [{ id: "kurs-1" }] }),
    });
    const res = await (PostCheckout as any)(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Niste ulogovani.");
  });

  it("403 ako nije KLIJENT", async () => {
    const token = createToken("EDUKATOR");
    const req = new NextRequest("http://localhost:3000/api/klijent/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ id: "kurs-1" }] }),
    });
    const res = await (PostCheckout as any)(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe("Pristup dozvoljen samo klijentima.");
  });

  it("200 Checkout URL za KLIJENTA", async () => {
    const token = createToken("KLIJENT");
    const req = new NextRequest("http://localhost:3000/api/klijent/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ id: "kurs-1" }] }),
    });
    const res = await (PostCheckout as any)(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("checkout.stripe.com");
  });
});