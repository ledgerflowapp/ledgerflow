import { renderToString } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

describe('Base UI State Data Attributes Verification', () => {
  it('TabsTrigger sets data-active attribute when active', () => {
    const html = renderToString(
      <Tabs defaultValue="OUT">
        <TabsList>
          <TabsTrigger value="OUT">You Gave</TabsTrigger>
          <TabsTrigger value="IN">You Got</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    expect(html).toContain('data-active')
    expect(html).not.toContain('data-[state=active]')
  })

  it('ToggleGroupItem sets data-pressed attribute when selected', () => {
    const html = renderToString(
      <ToggleGroup value={['food']}>
        <ToggleGroupItem value="food">Food</ToggleGroupItem>
        <ToggleGroupItem value="rent">Rent</ToggleGroupItem>
      </ToggleGroup>
    )

    expect(html).toContain('data-pressed')
    expect(html).not.toContain('data-[state=on]')
  })

  it('Transaction drawer components do not contain Radix data-[state=...] classes', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const files = [
      path.join(process.cwd(), 'src/components/business/BusinessTransactionDrawer.tsx'),
      path.join(process.cwd(), 'src/components/personal/PersonalTransactionDrawer.tsx'),
      path.join(process.cwd(), 'src/components/finance/RecurringTransactionDrawer.tsx'),
    ]

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      expect(content).not.toContain('data-[state=active]')
      expect(content).not.toContain('data-[state=on]')
    }
  })
})
