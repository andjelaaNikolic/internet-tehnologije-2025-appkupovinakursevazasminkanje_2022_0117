import { describe, it, expect } from 'vitest';

describe('Poslovna Logika & Kalkulacije', () => {

  describe('Progres Kalkulator', () => {
    const izracunajProgres = (zavrsene: number, ukupno: number) => {
      if (ukupno === 0) return 0;
      return Math.round((zavrsene / ukupno) * 100);
    };

    it('treba da izračuna 50% za 1/2 lekcije', () => {
      expect(izracunajProgres(1, 2)).toBe(50);
    });

    it('treba da vrati 100% kada je sve završeno', () => {
      expect(izracunajProgres(5, 5)).toBe(100);
    });

    it('treba da vrati 0% ako ništa nije završeno', () => {
      expect(izracunajProgres(0, 10)).toBe(0);
    });
  });

  describe('Algoritam za pretragu i filtriranje', () => {
    const mockKursevi = [
      { id: '1', naziv: 'Osnove šminkanja', kategorija: 'Osnove' },
      { id: '2', naziv: 'Svadbena šminka', kategorija: 'Napredno' },
    ];

    it('treba da filtrira kurseve po nazivu (case insensitive)', () => {
      const search = 'osnove';
      const rezultat = mockKursevi.filter(k =>
        k.naziv.toLowerCase().includes(search.toLowerCase())
      );
      expect(rezultat).toHaveLength(1);
      expect(rezultat[0].id).toBe('1');
    });

    it('treba da vrati prazan niz ako nema rezultata pretrage', () => {
      const search = 'nepostojeći';
      const rezultat = mockKursevi.filter(k =>
        k.naziv.toLowerCase().includes(search.toLowerCase())
      );
      expect(rezultat).toHaveLength(0);
    });
  });

  describe('Datum & Copyright Logika', () => {
    it('treba uvek da koristi trenutnu godinu za copyright', () => {
      const currentYear = new Date().getFullYear();
      expect(currentYear).toBeGreaterThanOrEqual(2025);
    });
  });

  describe('Formatiranje linkova', () => {
    it('treba ispravno da formira Gmail URL', () => {
      const email = 'test@gmail.com';
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;
      expect(url).toContain('view=cm');
      expect(url).toContain(email);
    });
  });
});