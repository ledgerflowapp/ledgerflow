import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { SplitSimulator } from '../SplitSimulator';

describe('SplitSimulator Component', () => {
  it('renders correctly with default mock members and tab options', () => {
    const html = renderToString(<SplitSimulator />);

    // Equal mode is the default and should render members and default amounts
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain('Charlie');

    // Verify Tab options are present
    expect(html).toContain('Equal (=)');
    expect(html).toContain('Exact (₹)');
    expect(html).toContain('Percent (%)');
  });
});
