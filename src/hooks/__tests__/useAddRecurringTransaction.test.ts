import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
    mockAddRecurringTransaction, mockDeleteContact, mockToast,
} = vi.hoisted(() => {
    const mockAddRecurringTransaction = vi.fn()
    const mockDeleteContact = vi.fn()
    const mockToast = { success: vi.fn(), error: vi.fn() }
    return { mockAddRecurringTransaction, mockDeleteContact, mockToast }
})

vi.mock('@/lib/actions/recurring', () => ({
    addRecurringTransaction: (data: any) => mockAddRecurringTransaction(data),
}))

vi.mock('@/lib/actions/contacts', () => ({
    deleteContact: (id: string) => mockDeleteContact(id),
}))

let capturedMutationConfig: Record<string, any>

vi.mock('@tanstack/react-query', () => ({
    useMutation: (config: Record<string, any>) => {
        capturedMutationConfig = config
        return { mutate: vi.fn(), mutateAsync: vi.fn() }
    },
    useQueryClient: () => ({
        invalidateQueries: vi.fn(),
        removeQueries: vi.fn(),
    }),
}))

vi.mock('@/components/ui/toast', () => ({ toast: mockToast }))

import { useAddRecurringTransaction } from '../useAddRecurringTransaction'
import { useDeleteContact } from '../useDeleteContact'

describe('useAddRecurringTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockAddRecurringTransaction.mockResolvedValue({ id: 'rec-123' })
        useAddRecurringTransaction()
    })

    it('calls addRecurringTransaction server action with params', async () => {
        await capturedMutationConfig.mutationFn({
            name: 'Netflix',
            amount: 199,
            flow: 'OUT',
            frequency: 'MONTHLY',
            start_date: '2026-04-01',
            next_run_date: '2026-05-01',
        })

        expect(mockAddRecurringTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Netflix',
                amount: 199,
            })
        )
    })

    it('calls toast.error on failure', async () => {
        capturedMutationConfig.onError(new Error('DB error'))
        expect(mockToast.error).toHaveBeenCalledWith('Failed to create: DB error')
    })
})

describe('useDeleteContact', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDeleteContact.mockResolvedValue('contact-456')
        useDeleteContact()
    })

    it('calls deleteContact server action with id', async () => {
        await capturedMutationConfig.mutationFn('contact-456')
        expect(mockDeleteContact).toHaveBeenCalledWith('contact-456')
    })
})
