import { describe, test, expect, vi } from "vitest";


vi.mock("jsonwebtoken", () => ({
  default: {
    verify: (token: string) => {
      if (token === "validanAdminToken") return { uloga: "ADMIN" };
      if (token === "tokenKojiNijeAdmin") return { uloga: "KLIJENT" };
      throw new Error("Nevalidan token");
    },
    decode: (token: string) => {
      if (token === "validanAdminToken") return { uloga: "ADMIN" };
      if (token === "tokenKojiNijeAdmin") return { uloga: "KLIJENT" };
      return null;
    }
  }
}));


let mockAuthHeader: string | null = null;

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => {
      if (name === "authorization") return mockAuthHeader;
      return null;
    }
  }),
  cookies: async () => ({
    get: () => undefined
  })
}));

// ================= IMPORT RUTA =================
import { GET as IzvestajiHandler } from "../src/app/api/admin/izvestaji/route";
import { GET as KorisniciHandler } from "../src/app/api/admin/korisnici/route";
import { GET as StatistikaHandler } from "../src/app/api/admin/statistika-prodaje/route";

describe("API Admin", () => {

  test("401 ako nema tokena", async () => {
    mockAuthHeader = null;
    const req = new Request("http://localhost/api/admin/izvestaji");
    const res = await IzvestajiHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Niste ulogovani.");
  });

  test("403 ako nije ADMIN", async () => {
    mockAuthHeader = "Bearer tokenKojiNijeAdmin";
    const req = new Request("http://localhost/api/admin/izvestaji");
    const res = await IzvestajiHandler(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toContain("Pristup");
  });

  test("200 ako je ADMIN", async () => {
    mockAuthHeader = "Bearer validanAdminToken";
    const req = new Request("http://localhost/api/admin/izvestaji");
    const res = await IzvestajiHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("data");
  });

  test("200 Korisnici ako je ADMIN", async () => {
    mockAuthHeader = "Bearer validanAdminToken";
    const req = new Request("http://localhost/api/admin/korisnici");
    const res = await KorisniciHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("users");
  });

  test("200 Statistika ako je ADMIN", async () => {
    mockAuthHeader = "Bearer validanAdminToken";
    const req = new Request("http://localhost/api/admin/statistika");
    const res = await StatistikaHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("stats");
  });
});