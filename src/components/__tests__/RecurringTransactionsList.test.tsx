import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RecurringTransactionsList } from '../finance/RecurringTransactionsList'
import { RecurringTransaction } from '@/types'

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const mockDeleteTransaction = vi.fn()
const mockUpdateTransaction = vi.fn()

const mockTransactions: RecurringTransaction[] = [
    {
        id: 'rec-1',
        account_id: 'acc-1',
        category_id: 'cat-1',
        amount: 49900,
        flow: 'OUT',
        name: 'Netflix Premium',
        note: '4K monthly',
        start_date: '2026-01-01T00:00:00.000Z',
        next_run_date: '2026-02-01T00:00:00.000Z',
        last_run_date: null,
        frequency: 'MONTHLY',
        schedule_mode: 'CALENDAR',
        active: true,
        failure_count: 0,
        last_failure_reason: null,
        category: { name: 'Entertainment', icon: '🎬' },
        account: { name: 'HDFC Bank', type: 'BANK' },
    },
    {
        id: 'rec-2',
        account_id: 'acc-1',
        category_id: 'cat-2',
        amount: 150000,
        flow: 'OUT',
        name: 'Gym Membership',
        note: 'Paused',
        start_date: '2026-01-01T00:00:00.000Z',
        next_run_date: '2026-02-01T00:00:00.000Z',
        last_run_date: null,
        frequency: 'MONTHLY',
        schedule_mode: 'CALENDAR',
        active: false,
        failure_count: 3,
        last_failure_reason: 'Card expired',
        category: { name: 'Fitness', icon: '🏋️' },
        account: { name: 'HDFC Bank', type: 'BANK' },
    },
]

vi.mock('@/hooks/useRecurringTransactions', () => ({
    useRecurringTransactions: () => ({
        data: mockTransactions,
        isLoading: false,
    }),
}))

vi.mock('@/hooks/useDeleteRecurringTransaction', () => ({
    useDeleteRecurringTransaction: () => ({
        mutate: mockDeleteTransaction,
        isPending: false,
    }),
}))

vi.mock('@/hooks/useUpdateRecurringTransaction', () => ({
    useUpdateRecurringTransaction: () => ({
        mutate: mockUpdateTransaction,
        isPending: false,
    }),
}))

vi.mock('@/hooks/useAddRecurringTransaction', () => ({
    useAddRecurringTransaction: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}))

vi.mock('@/hooks/useBudgets', () => ({
    useBudgets: () => ({ data: [] }),
}))

vi.mock('@/hooks/useAccounts', () => ({
    useAccounts: () => ({ data: [] }),
}))

describe('RecurringTransactionsList Mobile & Desktop Interactions', () => {
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

    it('renders desktop hover action buttons and mobile more-options button', async () => {
        await act(async () => {
            root.render(
                <QueryClientProvider client={queryClient}>
                    <RecurringTransactionsList />
                </QueryClientProvider>
            )
        })

        // Desktop action container exists
        const desktopActionContainers = container.querySelectorAll('.desktop-actions')
        expect(desktopActionContainers.length).toBe(mockTransactions.length)

        // Mobile more-options triggers exist with accessible labels
        const mobileTriggers = container.querySelectorAll('button[data-slot="mobile-action-trigger"]')
        expect(mobileTriggers.length).toBe(mockTransactions.length)
    })

    it('opens bottom sheet drawer with actions when mobile more-options button is clicked', async () => {
        await act(async () => {
            root.render(
                <QueryClientProvider client={queryClient}>
                    <RecurringTransactionsList />
                </QueryClientProvider>
            )
        })

        const mobileTriggers = container.querySelectorAll('button[data-slot="mobile-action-trigger"]')
        expect(mobileTriggers.length).toBeGreaterThan(0)

        const firstTrigger = mobileTriggers[0] as HTMLButtonElement

        await act(async () => {
            firstTrigger.click()
        })

        // Drawer bottom sheet opens displaying actions
        expect(document.body.textContent).toContain('Netflix Premium')
        expect(document.body.textContent).toContain('Edit Subscription')
        expect(document.body.textContent).toContain('Delete Subscription')
    })

    it('displays resume action in mobile bottom sheet for paused recurring transactions', async () => {
        await act(async () => {
            root.render(
                <QueryClientProvider client={queryClient}>
                    <RecurringTransactionsList />
                </QueryClientProvider>
            )
        })

        const mobileTriggers = container.querySelectorAll('button[data-slot="mobile-action-trigger"]')
        const pausedTrigger = mobileTriggers[1] as HTMLButtonElement

        await act(async () => {
            pausedTrigger.click()
        })

        expect(document.body.textContent).toContain('Gym Membership')
        expect(document.body.textContent).toContain('Resume Subscription')
    })
})
