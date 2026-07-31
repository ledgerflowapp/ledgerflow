import { useQuery } from '@tanstack/react-query'
import { getGroupsAction } from '@/lib/actions/groups'
import { Group } from '@/types'

export function useGroups() {
    return useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const data = await getGroupsAction()
            return data as unknown as Group[]
        }
    })
}
