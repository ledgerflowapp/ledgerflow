import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('DashboardPage dynamic code-splitting', () => {
    it('does not statically import recharts in dashboard page', () => {
        const pageContent = fs.readFileSync(
            path.join(process.cwd(), 'src/app/dashboard/page.tsx'),
            'utf-8'
        )

        expect(pageContent).not.toContain("from 'recharts'")
        expect(pageContent).not.toContain('from "recharts"')
        expect(pageContent).toContain('next/dynamic')
        expect(pageContent).toContain('AnalyticsDashboardSkeleton')
        expect(pageContent).toContain('ssr: false')
    })
})
