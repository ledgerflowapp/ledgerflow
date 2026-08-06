import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockUpdateContact, mockInvalidateQueries } = vi.hoisted(() => {
    return {
        mockUpdateContact: vi.fn(),
        mockInvalidateQueries: vi.fn(),
    }
})

vi.mock('@/lib/actions/contacts', () => ({
    updateContact: (params: any) => mockUpdateContact(params),
}))

vi.mock('@/components/ui/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@tanstack/react-query', () => ({
    useMutation: (config: Record<string, any>) => {
        return {
            mutationFn: config.mutationFn,
            onSuccess: config.onSuccess,
            onError: config.onError,
            _config: config,
        }
    },
    useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries,
    }),
}))

type AnyHook = Record<string, any>

import { useUpdateContact } from '../useUpdateContact'

describe('useUpdateContact', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUpdateContact.mockResolvedValue({ id: 'contact-1' })
    })

    it('calls updateContact server action with params', async () => {
        const hook = useUpdateContact() as unknown as AnyHook
        await hook.mutationFn({
            id: 'contact-1',
            name: 'Alice',
            phone: '9876543210',
            type: 'SUPPLIER',
        })

        expect(mockUpdateContact).toHaveBeenCalledWith({
            id: 'contact-1',
            name: 'Alice',
            phone: '9876543210',
            type: 'SUPPLIER',
        })
    })

    it('invalidates ["contacts"] and ["personal-people"] on success', () => {
        const hook = useUpdateContact() as unknown as AnyHook
        hook.onSuccess({ id: 'contact-1' })

        const invalidatedKeys = mockInvalidateQueries.mock.calls.map(
            (call: unknown[][]) => call[0]
        )

        expect(invalidatedKeys).toContainEqual({ queryKey: ['contacts'] })
        expect(invalidatedKeys).toContainEqual({ queryKey: ['personal-people'] })
    })
})
