import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import GlobalSearch from './global-search';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        'globalSearch.button': 'Keresés',
        'globalSearch.placeholder': 'Keresés szerződésekben...',
        'globalSearch.contracts': 'Szerződések',
        'globalSearch.partners': 'Partnerek',
        'globalSearch.templates': 'Sablonok',
        'globalSearch.startTyping': 'Kezdjen el gépelni...',
        'globalSearch.statusDraft': 'Vázlat',
        'globalSearch.statusPending': 'Aláírásra vár',
        'globalSearch.statusSigned': 'Aláírt',
        'globalSearch.statusDeclined': 'Elutasított',
        'globalSearch.statusExpired': 'Lejárt',
      };
      if (key === 'globalSearch.noResults' && params) {
        return `Nincs találat: "${params.query}"`;
      }
      return map[key] ?? key;
    },
  }),
}));

// Mock api
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/lib/api';

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    pushMock.mockClear();
    vi.mocked(api.get).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens search dialog on Ctrl+K', () => {
    render(<GlobalSearch />);

    // Dialog should not be visible initially
    expect(screen.queryByPlaceholderText('Keresés szerződésekben...')).not.toBeInTheDocument();

    // Press Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    // Input should now be visible
    expect(screen.getByPlaceholderText('Keresés szerződésekben...')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<GlobalSearch />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByPlaceholderText('Keresés szerződésekben...')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Keresés szerződésekben...')).not.toBeInTheDocument();
  });

  it('opens search dialog when clicking the search button', async () => {
    render(<GlobalSearch />);

    fireEvent.click(screen.getByText('Keresés'));
    expect(screen.getByPlaceholderText('Keresés szerződésekben...')).toBeInTheDocument();
  });

  it('debounces input and calls API after 300ms', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          contracts: [{ id: '1', title: 'Megbízási szerződés', status: 'draft', signers: [] }],
          contacts: [],
          templates: [],
        },
      },
    });

    render(<GlobalSearch />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText('Keresés szerződésekben...');
    fireEvent.change(input, { target: { value: 'Me' } });

    // API should not be called immediately
    expect(api.get).not.toHaveBeenCalled();

    // Advance time by 300ms (debounce)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(api.get).toHaveBeenCalledWith('/search', { params: { q: 'Me' } });
  });

  it('shows results from API', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          contracts: [{ id: '1', title: 'Megbízási szerződés', status: 'signed', signers: [{ name: 'Kiss Péter', email: 'kiss@test.hu' }] }],
          contacts: [{ id: '2', name: 'Nagy Anna', email: 'anna@test.hu', company: 'Teszt Kft.' }],
          templates: [{ id: '3', name: 'Bérleti sablon', category: 'Ingatlan' }],
        },
      },
    });

    render(<GlobalSearch />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText('Keresés szerződésekben...');
    fireEvent.change(input, { target: { value: 'teszt' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Megbízási szerződés')).toBeInTheDocument();
      expect(screen.getByText('Nagy Anna')).toBeInTheDocument();
      expect(screen.getByText('Bérleti sablon')).toBeInTheDocument();
    });
  });

  it('does not call API for queries shorter than 2 characters', async () => {
    render(<GlobalSearch />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText('Keresés szerződésekben...');
    fireEvent.change(input, { target: { value: 'a' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('navigates when clicking a result', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          contracts: [{ id: 'c1', title: 'Teszt szerződés', status: 'draft', signers: [] }],
          contacts: [],
          templates: [],
        },
      },
    });

    render(<GlobalSearch />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const input = screen.getByPlaceholderText('Keresés szerződésekben...');
    fireEvent.change(input, { target: { value: 'Teszt' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Teszt szerződés')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Teszt szerződés'));
    expect(pushMock).toHaveBeenCalledWith('/contracts/c1');
  });
});
