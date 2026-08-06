import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { Input } from '../ui/input'

describe('Input Component', () => {
  it('renders input with standalone text-foreground class for text color visibility', () => {
    const html = renderToString(<Input data-testid="test-input" placeholder="Enter text..." />)
    // Extract class attribute content
    const classMatch = html.match(/class="([^"]+)"/)
    expect(classMatch).not.toBeNull()
    const classes = classMatch![1].split(' ')
    expect(classes).toContain('text-foreground')
  })

  it('passes down standard input attributes like autoComplete and type', () => {
    const html = renderToString(
      <Input
        data-testid="email-input"
        type="email"
        autoComplete="email"
        placeholder="m@example.com"
      />
    )
    expect(html).toContain('type="email"')
    expect(html).toContain('autoComplete="email"')
  })
})
