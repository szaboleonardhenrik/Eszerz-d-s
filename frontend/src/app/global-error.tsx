'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('[GLOBAL_ERROR]', error.message, error.stack);
    fetch('/api/health/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'global',
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="hu">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
          {/* SVG Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <svg
              width="180"
              height="140"
              viewBox="0 0 180 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Shield with X */}
              <path
                d="M90 10L150 35V70C150 105 125 130 90 140C55 130 30 105 30 70V35L90 10Z"
                fill="#FEE2E2"
                stroke="#EF4444"
                strokeWidth="3"
              />
              {/* X mark */}
              <line x1="70" y1="55" x2="110" y2="95" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
              <line x1="110" y1="55" x2="70" y2="95" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.75rem 0' }}>
            Kritikus hiba
          </h1>

          {/* Message */}
          <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
            Az alkalmazás váratlan hibába ütközött.
            Kérjük, próbáld újra.
          </p>

          {/* Error digest */}
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'monospace', margin: '0 0 2rem 0' }}>
              Hibakod: {error.digest}
            </p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 500,
                fontSize: '1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Újrapróba
            </button>

            <a
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontWeight: 500,
                fontSize: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Vissza a főoldalra
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
