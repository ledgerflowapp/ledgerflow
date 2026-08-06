import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { AnalyticsDashboardSkeleton } from '../finance/AnalyticsDashboardSkeleton'

describe('AnalyticsDashboardSkeleton', () => {
    it('renders skeleton card container with title', () => {
        const html = renderToString(<AnalyticsDashboardSkeleton />)
        expect(html).toContain('Spending by Category')
        expect(html).toContain('data-slot="skeleton"')
    })
})
