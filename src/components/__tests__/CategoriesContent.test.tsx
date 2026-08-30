import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoriesContent } from '../finance/CategoriesContent'

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const { mockCategories } = vi.hoisted(() => ({
    mockCategories: [
        {
            id: 'cat-1',
            name: 'Groceries',
            type: 'EXPENSE',
            icon: 'groceries',
            active: true,
        },
        {
            id: 'cat-2',
            name: 'Salary',
            type: 'INCOME',
            icon: 'wallet',
            active: false,
        },
    ],
}))

vi.mock('@/lib/actions/categories', () => ({
    getCategories: vi.fn().mockResolvedValue(mockCategories),
    updateCategory: vi.fn().mockResolvedValue({ success: true }),
    deleteCategory: vi.fn().mockResolvedValue({ success: true }),
    createCategory: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/hooks/useBudgets', () => ({
    useBudgets: () => ({ data: [] }),
}))

vi.mock('@/hooks/useAccounts', () => ({
    useAccounts: () => ({ data: [] }),
}))

describe('CategoriesContent Mobile & Desktop Interactions', () => {
    let container: HTMLDivElement
    let root: Root
    let queryClient: QueryClient

    beforeEach(() => {
        vi.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        })
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
    })

    it('renders mobile more-options triggers with ActionDrawer bottom sheet support', async () => {
        await act(async () => {
            root.render(
                <QueryClientProvider client={queryClient}>
                    <CategoriesContent />
                </QueryClientProvider>
            )
        })

        // Wait for query resolution
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
        })

        const mobileTriggers = container.querySelectorAll('button[data-slot="mobile-action-trigger"]')
        expect(mobileTriggers.length).toBe(mockCategories.length)

        const firstTrigger = mobileTriggers[0] as HTMLButtonElement
        await act(async () => {
            firstTrigger.click()
        })

        // Verify bottom sheet drawer displays category actions
        expect(document.body.textContent).toContain('Groceries')
        expect(document.body.textContent).toContain('Edit')
        expect(document.body.textContent).toContain('Disable')
        expect(document.body.textContent).toContain('Delete')
    })
})
