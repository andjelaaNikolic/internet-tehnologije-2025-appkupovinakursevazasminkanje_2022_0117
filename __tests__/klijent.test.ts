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
    expect(Array.isArray(body)).toBe(true); 
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