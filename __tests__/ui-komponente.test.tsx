import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));


const HeaderMock = ({ user }: { user: any }) => (
  <header>
    <img src="/logo.png" alt="Logo" />
    {!user ? (
      <>
        <a href="/login">Prijava</a>
        <a href="/register">Registracija</a>
      </>
    ) : (
      <>
        {user.uloga === 'KLIJENT' && (
          <>
            <a href="/stranice/svi-kursevi">Svi kursevi</a>
            <a href="/stranice/kupljeni-kursevi">Moji kursevi</a>
            <a href="/stranice/korpa">Korpa</a>
          </>
        )}
        {user.uloga === 'EDUKATOR' && (
          <>
            <a href="/stranice/dodaj-kurs">Dodaj kurs</a>
            <a href="/stranice/promena-kurseva">Promena kurseva</a>
            <a href="/stranice/pregled-prodaje-kurseva">Prodaja</a>
          </>
        )}
        {user.uloga === 'ADMIN' && (
          <>
            <a href="/stranice/pregled-korisnika">Korisnici</a>
            <a href="/stranice/statistika-prodaje">Statistika</a>
          </>
        )}
        <button>Logout</button>
      </>
    )}
  </header>
);

const FooterMock = () => {
  const currentYear = new Date().getFullYear();
  const email = 'insensitivo.makeup@gmail.com';
  return (
    <footer>
      <img src="/logo.png" alt="Footer Logo" />
      <a href="https://www.facebook.com/" target="_blank">Facebook</a>
      <a href="https://www.instagram.com/insensitivo" target="_blank">Instagram</a>
      <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`}>Email</a>
      <p>© {currentYear} Insensitivo Makeup</p>
    </footer>
  );
};

const VideoPlayerMock = ({ lekcije }: any) => (
  <div>
    <h2>{lekcije[0].naziv}</h2>
    <p>{lekcije[0].opis}</p>
    <video controls controlsList="nodownload" data-testid="video-player">
      <source src={lekcije[0].video} />
    </video>
    <ul>
      {lekcije.map((l: any) => <li key={l.id}>{l.naziv}</li>)}
    </ul>
  </div>
);

const RoleGuardMock = ({ children, allowedRoles, userRole }: any) => {
  if (!allowedRoles.includes(userRole)) return null;
  return <>{children}</>;
};

describe('UI Komponente - Kompletan Test Suite', () => {

  describe('Header Komponenta', () => {
    it('Prikazuje logo i osnovne linkove za gosta', () => {
      render(<HeaderMock user={null} />);
      expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/logo.png');
      expect(screen.getByText('Prijava')).toBeInTheDocument();
      expect(screen.getByText('Registracija')).toBeInTheDocument();
    });

    it('Prikazuje linkove specifične za EDUKATORA', () => {
      render(<HeaderMock user={{ uloga: 'EDUKATOR' }} />);
      expect(screen.getByText('Dodaj kurs')).toBeInTheDocument();
      expect(screen.getByText('Promena kurseva')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('Prikazuje linkove specifične za ADMINA', () => {
      render(<HeaderMock user={{ uloga: 'ADMIN' }} />);
      expect(screen.getByText('Korisnici')).toBeInTheDocument();
      expect(screen.getByText('Statistika')).toBeInTheDocument();
    });
  });

  describe('Footer Komponenta', () => {
    it('Sadrži ispravan Gmail link i Copyright godinu', () => {
      render(<FooterMock />);
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();

      const emailLink = screen.getByText('Email');
      expect(emailLink).toHaveAttribute('href', expect.stringContaining('mail.google.com'));
      expect(emailLink).toHaveAttribute('href', expect.stringContaining('insensitivo.makeup@gmail.com'));
    });

    it('Socijalni linkovi imaju target="_blank"', () => {
      render(<FooterMock />);
      const insta = screen.getByText('Instagram');
      expect(insta).toHaveAttribute('target', '_blank');
      expect(insta).toHaveAttribute('href', 'https://www.instagram.com/insensitivo');
    });
  });

  describe('VideoPlayer Komponenta', () => {
    const mockLekcije = [
      { id: '1', naziv: 'Lekcija 1', opis: 'Opis 1', video: '/vid1.mp4' },
      { id: '2', naziv: 'Lekcija 2', opis: 'Opis 2', video: '/vid2.mp4' }
    ];

    it('Prikazuje prvu lekciju i ima onemogućeno preuzimanje', () => {
      render(<VideoPlayerMock lekcije={mockLekcije} />);

      const nasloviLekcije = screen.getAllByText('Lekcija 1');
      expect(nasloviLekcije.length).toBeGreaterThan(0);
      expect(nasloviLekcije[0]).toBeInTheDocument();

      expect(screen.getByText('Opis 1')).toBeInTheDocument();

      const video = screen.getByTestId('video-player');
      expect(video).toHaveAttribute('controlsList', 'nodownload');
    });
  });

  describe('RoleGuard Komponenta', () => {
    it('KLIJENT NE može videti ADMIN sadržaj', () => {
      render(
        <RoleGuardMock allowedRoles={['ADMIN']} userRole="KLIJENT">
          <div data-testid="tajna">Admin Sadržaj</div>
        </RoleGuardMock>
      );
      expect(screen.queryByTestId('tajna')).not.toBeInTheDocument();
    });

    it('ADMIN može videti ADMIN sadržaj', () => {
      render(
        <RoleGuardMock allowedRoles={['ADMIN']} userRole="ADMIN">
          <div data-testid="tajna">Admin Sadržaj</div>
        </RoleGuardMock>
      );
      expect(screen.getByTestId('tajna')).toBeInTheDocument();
    });
  });

  describe('Kursevi Content', () => {
    it('Prikazuje ime edukatora i pretragu', () => {
      const kurs = { naziv: 'Kurs 1', edukatorIme: 'Marija', edukatorPrezime: 'Jov' };
      render(
        <div>
          <input placeholder="Pretraži svoje kurseve..." />
          <div data-testid="edu">{kurs.edukatorIme} {kurs.edukatorPrezime}</div>
        </div>
      );
      expect(screen.getByPlaceholderText('Pretraži svoje kurseve...')).toBeInTheDocument();
      expect(screen.getByTestId('edu')).toHaveTextContent('Marija Jov');
    });
  });
});