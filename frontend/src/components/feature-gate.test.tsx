import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FeatureGate, { invalidateFeatureFlags } from './feature-gate';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        'featureGate.tierStarter': 'Starter',
        'featureGate.tierMedium': 'Medium',
        'featureGate.tierPremium': 'Prémium',
        'featureGate.tierEnterprise': 'Enterprise',
        'featureGate.tierHigher': 'magasabb',
        'featureGate.defaultFeature': 'Ez a funkció',
        'featureGate.upgradeDesc': 'Frissítsd az előfizetésed',
        'featureGate.upgradePlan': 'Csomag váltás',
      };
      if (key === 'featureGate.availableIn' && params) {
        return `${params.label} elérhető: ${params.tier}`;
      }
      return map[key] ?? key;
    },
  }),
}));

// Mock auth-store
const mockUser = { id: '1', email: 'test@test.com', name: 'Test', subscriptionTier: 'free' };
vi.mock('@/lib/auth-store', () => ({
  useAuth: (selector: (s: unknown) => unknown) => selector({ user: mockUser }),
}));

// Mock api - must return a promise by default
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

import api from '@/lib/api';

describe('FeatureGate', () => {
  beforeEach(() => {
    invalidateFeatureFlags();
    vi.mocked(api.get).mockResolvedValue({ data: { data: {} } });
  });

  it('renders children when no gate conditions', () => {
    render(
      <FeatureGate>
        <span>Protected Content</span>
      </FeatureGate>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when feature flag is true', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: { aiAnalysis: true } },
    });

    render(
      <FeatureGate featureKey="aiAnalysis">
        <span>AI Feature</span>
      </FeatureGate>,
    );

    // Initially renders children optimistically while loading
    expect(screen.getByText('AI Feature')).toBeInTheDocument();
  });

  it('shows upgrade prompt when tier is insufficient', async () => {
    // user is "free", required is "premium"
    render(
      <FeatureGate requiredTier="premium" featureName="AI elemzés">
        <span>Premium Content</span>
      </FeatureGate>,
    );

    // Wait for flags to load and tier check to apply
    await waitFor(() => {
      expect(screen.getByText('Csomag váltás')).toBeInTheDocument();
    });
    expect(screen.getByText(/AI elemzés elérhető/)).toBeInTheDocument();
  });

  it('renders children when user tier meets requirement', async () => {
    // Temporarily change user tier
    mockUser.subscriptionTier = 'premium';

    render(
      <FeatureGate requiredTier="starter">
        <span>Starter Content</span>
      </FeatureGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('Starter Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Csomag váltás')).not.toBeInTheDocument();

    // Reset
    mockUser.subscriptionTier = 'free';
  });

  it('shows upgrade prompt with link to billing', async () => {
    render(
      <FeatureGate requiredTier="medium">
        <span>Gated</span>
      </FeatureGate>,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Csomag váltás/i })).toBeInTheDocument();
    });
    const link = screen.getByRole('link', { name: /Csomag váltás/i });
    expect(link).toHaveAttribute('href', '/settings/billing');
  });
});
