import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from './cookie-consent';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'cookie.title': 'Cookie beállítások',
        'cookie.description': 'Az oldal sütiket használ.',
        'cookie.policyLink': 'Adatvédelmi tájékoztató',
        'cookie.settings': 'Beállítások',
        'cookie.essentialOnly': 'Csak szükségesek',
        'cookie.acceptAll': 'Elfogadom',
        'cookie.essential': 'Szükséges',
        'cookie.essentialDesc': 'Működéshez szükséges',
        'cookie.functional': 'Funkcionális',
        'cookie.functionalDesc': 'Személyre szabás',
        'cookie.analyticsLabel': 'Analitika',
        'cookie.analyticsDesc': 'Használati statisztikák',
        'cookie.save': 'Mentés',
        'cookie.cookieSettings': 'Cookie beállítások',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows banner when no consent in localStorage', () => {
    render(<CookieConsent />);
    expect(screen.getByText('Cookie beállítások')).toBeInTheDocument();
    expect(screen.getByText('Elfogadom')).toBeInTheDocument();
  });

  it('hides banner when consent already exists', () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({ essential: true, functional: true, analytics: true }),
    );
    render(<CookieConsent />);
    expect(screen.queryByText('Elfogadom')).not.toBeInTheDocument();
  });

  it('"Elfogadom" stores all preferences', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByText('Elfogadom'));

    const stored = JSON.parse(localStorage.getItem('cookie_consent')!);
    expect(stored).toEqual({ essential: true, functional: true, analytics: true });
    // Banner should disappear
    expect(screen.queryByText('Elfogadom')).not.toBeInTheDocument();
  });

  it('"Csak szükségesek" stores minimal preferences', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByText('Csak szükségesek'));

    const stored = JSON.parse(localStorage.getItem('cookie_consent')!);
    expect(stored).toEqual({ essential: true, functional: false, analytics: false });
  });

  it('"Beállítások" opens detailed options', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByText('Beállítások'));

    expect(screen.getByText('Funkcionális')).toBeInTheDocument();
    expect(screen.getByText('Analitika')).toBeInTheDocument();
    expect(screen.getByText('Mentés')).toBeInTheDocument();
  });

  it('cookie withdrawal clears localStorage and re-shows banner', async () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({ essential: true, functional: true, analytics: true }),
    );
    render(<CookieConsent />);

    // The small "Cookie beállítások" button should be visible
    const resetButton = screen.getByRole('button', { name: 'Cookie beállítások' });
    await userEvent.click(resetButton);

    expect(localStorage.getItem('cookie_consent')).toBeNull();
    // Banner should reappear
    expect(screen.getByText('Elfogadom')).toBeInTheDocument();
  });

  it('fires cookie_consent_changed event on accept', async () => {
    const handler = vi.fn();
    window.addEventListener('cookie_consent_changed', handler);

    render(<CookieConsent />);
    await userEvent.click(screen.getByText('Elfogadom'));

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('cookie_consent_changed', handler);
  });

  it('fires cookie_consent_changed event on reset', async () => {
    localStorage.setItem(
      'cookie_consent',
      JSON.stringify({ essential: true, functional: true, analytics: true }),
    );
    const handler = vi.fn();
    window.addEventListener('cookie_consent_changed', handler);

    render(<CookieConsent />);
    const resetButton = screen.getByRole('button', { name: 'Cookie beállítások' });
    await userEvent.click(resetButton);

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('cookie_consent_changed', handler);
  });
});
