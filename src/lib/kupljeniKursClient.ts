export async function fetchKupljeniKursSaLekcijama(id: string) {
  const res = await fetch(`/api/klijent/kupljeni-kursevi/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Greška pri komunikaciji sa serverom.' }));
    throw new Error(err.error || 'Greška pri učitavanju kursa.');
  }
  return await res.json();
}
