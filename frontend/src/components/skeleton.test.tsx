import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard, SkeletonRow, SkeletonText, SkeletonStats, SkeletonTemplateCard } from './skeleton';

describe('SkeletonCard', () => {
  it('renders with default styles', () => {
    const { container } = render(<SkeletonCard />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('bg-gray-200');
    expect(el.className).toContain('rounded-xl');
  });
});

describe('SkeletonRow', () => {
  it('renders with child skeleton elements', () => {
    const { container } = render(<SkeletonRow />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    // Should have multiple animated children
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(3);
  });
});

describe('SkeletonText', () => {
  it('renders with default full width', () => {
    const { container } = render(<SkeletonText />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('w-full');
  });

  it('accepts custom width className', () => {
    const { container } = render(<SkeletonText width="w-1/2" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('w-1/2');
    expect(el.className).not.toContain('w-full');
  });
});

describe('SkeletonStats', () => {
  it('renders 4 stat skeleton cards', () => {
    const { container } = render(<SkeletonStats />);
    const cards = container.querySelectorAll('.animate-pulse');
    expect(cards.length).toBe(4);
  });

  it('renders in a grid layout', () => {
    const { container } = render(<SkeletonStats />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('grid');
  });
});

describe('SkeletonTemplateCard', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<SkeletonTemplateCard />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('rounded-xl');
  });
});

describe('Multiple skeletons render together', () => {
  it('can render multiple skeleton types simultaneously', () => {
    const { container } = render(
      <div>
        <SkeletonCard />
        <SkeletonRow />
        <SkeletonText />
        <SkeletonStats />
        <SkeletonTemplateCard />
      </div>,
    );

    // All should be in the document
    const allPulse = container.querySelectorAll('.animate-pulse');
    // SkeletonCard(1) + SkeletonRow(4) + SkeletonText(1) + SkeletonStats(4) + SkeletonTemplateCard(1) = 11
    expect(allPulse.length).toBeGreaterThanOrEqual(5);
  });
});
