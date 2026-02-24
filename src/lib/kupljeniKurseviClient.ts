export async function fetchKupljeniKursevi() {
  const res = await fetch('/api/klijent/kupljeni-kursevi', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Greška pri komunikaciji sa serverom.' }));
    throw new Error(err.error || 'Greška pri učitavanju kupljenih kurseva.');
  }
  return await res.json();
}
