import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './empty-state';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const testIcon = 'M12 6v6m0 0v6m0-6h6m-6 0H6';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        icon={testIcon}
        title="Nincs szerződés"
        description="Hozzon létre egy új szerződést."
      />,
    );

    expect(screen.getByText('Nincs szerződés')).toBeInTheDocument();
    expect(screen.getByText('Hozzon létre egy új szerződést.')).toBeInTheDocument();
  });

  it('renders the SVG icon', () => {
    const { container } = render(
      <EmptyState
        icon={testIcon}
        title="Teszt"
        description="Leírás"
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('d', testIcon);
  });

  it('renders action button when actionLabel and actionHref are provided', () => {
    render(
      <EmptyState
        icon={testIcon}
        title="Nincs adat"
        description="Kezdje el a munkát."
        actionLabel="Új létrehozása"
        actionHref="/new"
      />,
    );

    const link = screen.getByText('Új létrehozása');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/new');
  });

  it('does not render action button when actionLabel is missing', () => {
    render(
      <EmptyState
        icon={testIcon}
        title="Nincs adat"
        description="Leírás"
      />,
    );

    // No link should be rendered beyond the component itself
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('does not render action button when only actionLabel is provided without actionHref', () => {
    render(
      <EmptyState
        icon={testIcon}
        title="Teszt"
        description="Leírás"
        actionLabel="Gomb"
      />,
    );

    expect(screen.queryByText('Gomb')).not.toBeInTheDocument();
  });
});
