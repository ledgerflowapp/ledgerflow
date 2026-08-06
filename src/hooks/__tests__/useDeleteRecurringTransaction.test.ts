import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
    mockDeleteRecurringTransaction, mockInvalidateQueries,
} = vi.hoisted(() => {
    const mockDeleteRecurringTransaction = vi.fn()
    const mockInvalidateQueries = vi.fn()
    return { mockDeleteRecurringTransaction, mockInvalidateQueries }
})

vi.mock('@/lib/actions/recurring', () => ({
    deleteRecurringTransaction: (id: string) => mockDeleteRecurringTransaction(id),
}))

let capturedMutationConfig: Record<string, any>

vi.mock('@tanstack/react-query', () => ({
    useMutation: (config: Record<string, any>) => {
        capturedMutationConfig = config
        return { mutate: vi.fn(), mutateAsync: vi.fn() }
    },
    useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries,
    }),
}))

vi.mock('@/components/ui/toast', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}))

import { useDeleteRecurringTransaction } from '../useDeleteRecurringTransaction'

describe('useDeleteRecurringTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDeleteRecurringTransaction.mockResolvedValue({ id: 'recurring-456' })
        useDeleteRecurringTransaction()
    })

    it('proceeds with delete via deleteRecurringTransaction server action', async () => {
        await capturedMutationConfig.mutationFn('recurring-456')
        expect(mockDeleteRecurringTransaction).toHaveBeenCalledWith('recurring-456')
    })

    it('invalidates ["recurring-transactions"] on success', () => {
        capturedMutationConfig.onSuccess()
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['recurring-transactions'],
        })
    })
})
