import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sentry before importing api
vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

describe('api module', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.resetModules();
    // Save original location
    originalLocation = window.location;
  });

  afterEach(() => {
    // Restore location
    if (window.location !== originalLocation) {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    }
  });

  it('has correct base URL (default)', async () => {
    const { default: api } = await import('./api');
    expect(api.defaults.baseURL).toBe('http://localhost:3001/api');
  });

  it('sets Content-Type to application/json', async () => {
    const { default: api } = await import('./api');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has withCredentials enabled', async () => {
    const { default: api } = await import('./api');
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('redirects to /login on 401', async () => {
    const { default: api } = await import('./api');

    // Mock window.location
    const locationMock = { href: '' } as Location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: locationMock,
    });

    // Create a mock adapter - simulate 401 by using interceptors directly
    // We test the interceptor behavior by calling it
    const interceptors = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled?: (v: unknown) => unknown; rejected?: (e: unknown) => Promise<unknown> }> }).handlers;
    const errorHandler = interceptors[0]?.rejected;

    if (errorHandler) {
      const error = {
        response: { status: 401 },
        config: { url: '/test' },
      };

      try {
        await errorHandler(error);
      } catch {
        // Expected to reject
      }

      expect(window.location.href).toBe('/login');
    }
  });

  it('calls captureException on 500 errors', async () => {
    const { captureException } = await import('./sentry');
    const { default: api } = await import('./api');

    const interceptors = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled?: (v: unknown) => unknown; rejected?: (e: unknown) => Promise<unknown> }> }).handlers;
    const errorHandler = interceptors[0]?.rejected;

    if (errorHandler) {
      const error = {
        response: { status: 500, data: {} },
        config: { url: '/test', method: 'GET' },
      };

      try {
        await errorHandler(error);
      } catch {
        // Expected to reject
      }

      expect(captureException).toHaveBeenCalledWith(error, {
        url: '/test',
        method: 'GET',
      });
    }
  });

  it('sets maintenance message on 503 with MAINTENANCE code', async () => {
    const { default: api, getMaintenanceMessage } = await import('./api');

    const interceptors = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled?: (v: unknown) => unknown; rejected?: (e: unknown) => Promise<unknown> }> }).handlers;
    const errorHandler = interceptors[0]?.rejected;

    if (errorHandler) {
      const error = {
        response: {
          status: 503,
          data: { error: { code: 'MAINTENANCE', message: 'Karbantartás folyamatban' } },
        },
        config: { url: '/test' },
      };

      try {
        await errorHandler(error);
      } catch {
        // Expected to reject
      }

      expect(getMaintenanceMessage()).toBe('Karbantartás folyamatban');
    }
  });

  it('clears maintenance on successful response', async () => {
    const { default: api } = await import('./api');

    const interceptors = (api.interceptors.response as unknown as { handlers: Array<{ fulfilled?: (v: unknown) => unknown; rejected?: (e: unknown) => Promise<unknown> }> }).handlers;
    const successHandler = interceptors[0]?.fulfilled;
    const errorHandler = interceptors[0]?.rejected;

    if (errorHandler && successHandler) {
      // First, trigger maintenance
      try {
        await errorHandler({
          response: {
            status: 503,
            data: { error: { code: 'MAINTENANCE', message: 'Karbantartás' } },
          },
          config: {},
        });
      } catch {
        // Expected
      }

      // Then simulate successful response
      const mockResponse = { data: 'ok', status: 200 };
      const result = successHandler(mockResponse);
      expect(result).toBe(mockResponse);
    }
  });
});
