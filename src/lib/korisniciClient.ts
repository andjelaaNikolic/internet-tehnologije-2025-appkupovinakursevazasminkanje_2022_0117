export async function fetchKorisnici() {
  const res = await fetch('/api/admin/korisnici', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Greška pri komunikaciji sa serverom.' }));
    throw new Error(err.error || 'Greška pri učitavanju korisnika.');
  }
  return await res.json();
}

export async function createKorisnik(payload: any) {
  const res = await fetch('/api/admin/korisnik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Greška pri komunikaciji sa serverom.' }));
    return { success: false, error: err.error || 'Greška pri dodavanju korisnika.' };
  }
  return await res.json();
}
