import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { getFormDefaults, recurringSchema, RecurringTransactionDrawer } from '../finance/RecurringTransactionDrawer'
import { RecurringTransaction } from '@/types'

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/hooks/useBudgets', () => ({
    useBudgets: () => ({ data: [{ id: 'cat-1', name: 'Entertainment', icon: '🎬' }] }),
}))

vi.mock('@/hooks/useAccounts', () => ({
    useAccounts: () => ({ data: [{ id: 'acc-1', name: 'HDFC Bank' }] }),
}))

const mockAddRecurring = vi.fn()
const mockUpdateRecurring = vi.fn()

vi.mock('@/hooks/useAddRecurringTransaction', () => ({
    useAddRecurringTransaction: () => ({
        mutate: mockAddRecurring,
        isPending: false,
    }),
}))

vi.mock('@/hooks/useUpdateRecurringTransaction', () => ({
    useUpdateRecurringTransaction: () => ({
        mutate: mockUpdateRecurring,
        isPending: false,
    }),
}))

vi.mock('@/components/ui/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

function createMockRecurringTransaction(overrides?: Partial<RecurringTransaction>): RecurringTransaction {
    return {
        id: 'rec-1',
        account_id: 'acc-1',
        category_id: 'cat-1',
        amount: 500000, // 5000 INR
        flow: 'OUT',
        name: 'Netflix',
        note: 'Monthly subscription',
        start_date: '2026-01-01T00:00:00.000Z',
        next_run_date: '2026-02-01T00:00:00.000Z',
        last_run_date: null,
        frequency: 'MONTHLY',
        schedule_mode: 'CALENDAR',
        active: false,
        failure_count: 2,
        last_failure_reason: 'Insufficient funds',
        category: { name: 'Entertainment', icon: '🎬' },
        account: { name: 'HDFC Bank', type: 'BANK' },
        ...overrides,
    }
}

describe('getFormDefaults', () => {
    it('returns default values for new transaction when initialData is null/undefined', () => {
        const defaults = getFormDefaults(null)
        expect(defaults.amount).toBeUndefined()
        expect(defaults.name).toBe('')
        expect(defaults.note).toBeUndefined()
        expect(defaults.frequency).toBe('MONTHLY')
        expect(defaults.schedule_mode).toBe('CALENDAR')
        expect(defaults.flow).toBe('OUT')
    })

    it('populates initial values correctly from initialData including paise to rupees conversion', () => {
        const mockRule = createMockRecurringTransaction()
        const defaults = getFormDefaults(mockRule)

        expect(defaults.amount).toBe(5000)
        expect(defaults.name).toBe('Netflix')
        expect(defaults.note).toBe('Monthly subscription')
        expect(defaults.frequency).toBe('MONTHLY')
        expect(defaults.schedule_mode).toBe('CALENDAR')
        expect(defaults.account_id).toBe('acc-1')
        expect(defaults.category_id).toBe('cat-1')
        expect(defaults.flow).toBe('OUT')
    })
})

describe('recurringSchema amount validation', () => {
    const validBase = {
        name: 'Internet Bill',
        account_id: 'acc-1',
        start_date: new Date(),
        frequency: 'MONTHLY' as const,
        schedule_mode: 'CALENDAR' as const,
        flow: 'OUT' as const,
    }

    it('rejects NaN or empty amount with error message', () => {
        const result = recurringSchema.safeParse({ ...validBase, amount: NaN })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Amount must be greater than 0')
        }
    })

    it('rejects amount less than 1', () => {
        const result = recurringSchema.safeParse({ ...validBase, amount: 0 })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Amount must be greater than 0')
        }
    })

    it('accepts valid numeric amount greater than 0', () => {
        const result = recurringSchema.safeParse({ ...validBase, amount: 499 })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.amount).toBe(499)
        }
    })
})

describe('RecurringTransactionDrawer active state preservation on edit', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        vi.clearAllMocks()
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

    const pausedRule = createMockRecurringTransaction({
        id: 'rec-paused',
        name: 'Spotify',
        note: 'Music',
        amount: 19900, // 199 INR
        active: false,
        failure_count: 3,
        last_failure_reason: 'Account closed',
    })

    it('preserves active: false when submitting updates to a paused rule', async () => {
        await act(async () => {
            root.render(<RecurringTransactionDrawer initialData={pausedRule} />)
        })

        const trigger = container.querySelector('button') as HTMLButtonElement
        expect(trigger).not.toBeNull()
        expect(trigger.textContent).toContain('Edit Subscription')

        await act(async () => {
            trigger.click()
        })

        const form = document.querySelector('form') as HTMLFormElement
        expect(form).not.toBeNull()

        await act(async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        })

        expect(mockUpdateRecurring).toHaveBeenCalledTimes(1)
        const callArg = mockUpdateRecurring.mock.calls[0][0]
        expect(callArg.id).toBe('rec-paused')
        expect(callArg.data.active).toBe(false)
    })

    it('preserves active: true when submitting updates to an active rule', async () => {
        const activeRule = createMockRecurringTransaction({
            id: 'rec-active',
            active: true,
            failure_count: 0,
            last_failure_reason: null,
        })

        await act(async () => {
            root.render(<RecurringTransactionDrawer initialData={activeRule} />)
        })

        const trigger = container.querySelector('button') as HTMLButtonElement
        await act(async () => {
            trigger.click()
        })

        const form = document.querySelector('form') as HTMLFormElement
        expect(form).not.toBeNull()

        await act(async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        })

        expect(mockUpdateRecurring).toHaveBeenCalledTimes(1)
        const callArg = mockUpdateRecurring.mock.calls[0][0]
        expect(callArg.id).toBe('rec-active')
        expect(callArg.data.active).toBe(true)
    })
})
