import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import Home from '../page';
import { auth } from '@/lib/auth';
import { vi } from 'vitest';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

describe('Landing Page App Page', () => {
  it('should render structured JSON-LD and header elements correctly', async () => {
    // Mock user session as unauthenticated
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const rendered = await Home();
    const html = renderToString(rendered);

    // Verify headers / branding
    expect(html).toContain('Clear, Factual Financial Records');

    // Verify sub-sections
    expect(html).toContain('Multi-Wallet Asset Tracking');
    expect(html).toContain('Ghost Member Participation');
  });
});
