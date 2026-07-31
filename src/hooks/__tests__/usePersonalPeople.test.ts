import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetPersonalPeople } = vi.hoisted(() => {
    return { mockGetPersonalPeople: vi.fn() }
})

vi.mock('@/lib/actions/contacts', () => ({
    getPersonalPeople: (filters: any) => mockGetPersonalPeople(filters),
}))

vi.mock('@tanstack/react-query', () => ({
    useQuery: (config: Record<string, any>) => {
        return {
            queryKey: config.queryKey,
            queryFn: config.queryFn,
            _config: config,
        }
    },
}))

type AnyHook = Record<string, any>

import { usePersonalPeople } from '../personal/usePersonalPeople'

describe('usePersonalPeople', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPersonalPeople.mockResolvedValue([])
    })

    it('passes filters to getPersonalPeople server action', async () => {
        const hook = usePersonalPeople({ timeFilter: 'MONTH', sortBy: 'MOST_ACTIVE' }) as unknown as AnyHook
        await hook.queryFn()

        expect(mockGetPersonalPeople).toHaveBeenCalledWith({
            timeFilter: 'MONTH',
            sortBy: 'MOST_ACTIVE',
        })
    })
})
