import { useQuery } from '@tanstack/react-query'
import { getGoalsAction } from '@/lib/actions/goals'
import { Goal } from '@/types'

export type { Goal }

export function useGoals() {
    return useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            const data = await getGoalsAction()
            return data as Goal[]
        },
    })
}
