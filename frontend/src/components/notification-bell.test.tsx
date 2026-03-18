import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from './notification-bell';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'notificationBell.title': 'Értesítések',
        'notificationBell.markAllRead': 'Összes olvasottnak jelölése',
        'notificationBell.empty': 'Nincs értesítés',
        'notificationBell.viewAll': 'Összes megtekintése',
        'notificationBell.realtime': 'Valós idejű',
        'notificationBell.timeNow': 'most',
        'notificationBell.timeMinutes': 'perce',
        'notificationBell.timeHours': 'órája',
        'notificationBell.timeDays': 'napja',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/lib/socket', () => ({
  useSocket: () => ({ connect: vi.fn(), disconnect: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockGet.mockReset();
    mockPut.mockReset();
    // Default: no unread
    mockGet.mockImplementation((url: string) => {
      if (url === '/notifications/unread-count') {
        return Promise.resolve({ data: { data: { count: 0 } } });
      }
      if (url === '/notifications') {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: null } });
    });
    mockPut.mockResolvedValue({ data: { success: true } });
  });

  it('renders the bell icon button', async () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Should contain an SVG (the bell icon)
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('clicking bell toggles notification panel', async () => {
    render(<NotificationBell />);
    const button = screen.getByRole('button');

    // Panel should not be visible initially
    expect(screen.queryByText('Értesítések')).not.toBeInTheDocument();

    // Click to open
    await userEvent.click(button);
    expect(screen.getByText('Értesítések')).toBeInTheDocument();

    // Click again to close
    await userEvent.click(button);
    expect(screen.queryByText('Értesítések')).not.toBeInTheDocument();
  });

  it('shows unread count badge when there are unread notifications', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/notifications/unread-count') {
        return Promise.resolve({ data: { data: { count: 3 } } });
      }
      if (url === '/notifications') {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: null } });
    });

    render(<NotificationBell />);

    // Wait for the unread count to appear
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows 9+ when unread count exceeds 9', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/notifications/unread-count') {
        return Promise.resolve({ data: { data: { count: 15 } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  it('mark all read button works', async () => {
    const notifications = [
      { id: '1', type: 'system', title: 'Test notification', message: 'Hello', read: false, createdAt: new Date().toISOString() },
    ];

    mockGet.mockImplementation((url: string) => {
      if (url === '/notifications/unread-count') {
        return Promise.resolve({ data: { data: { count: 1 } } });
      }
      if (url === '/notifications') {
        return Promise.resolve({ data: { data: notifications } });
      }
      return Promise.resolve({ data: { data: null } });
    });

    render(<NotificationBell />);

    // Wait for unread count to load
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Open panel
    await userEvent.click(screen.getByRole('button'));

    // Wait for notifications to load and mark all read button to appear
    await waitFor(() => {
      expect(screen.getByText('Összes olvasottnak jelölése')).toBeInTheDocument();
    });

    // Click mark all read
    await userEvent.click(screen.getByText('Összes olvasottnak jelölése'));

    expect(mockPut).toHaveBeenCalledWith('/notifications/read-all');

    // Badge should disappear (unread count = 0)
    await waitFor(() => {
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    render(<NotificationBell />);

    // Open panel
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Nincs értesítés')).toBeInTheDocument();
    });
  });

  it('shows view all link in panel', async () => {
    render(<NotificationBell />);
    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Összes megtekintése')).toBeInTheDocument();
    expect(screen.getByText('Összes megtekintése').closest('a')).toHaveAttribute('href', '/notifications');
  });
});
