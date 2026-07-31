import { useQuery } from '@tanstack/react-query'
import { getGroupDetailsAction } from '@/lib/actions/groups'
import { Group, GroupMember } from '@/types'

export interface GroupDetails {
    group: Group
    members: (GroupMember & {
        profiles?: {
            full_name: string | null
            avatar_url: string | null
        }
    })[]
}

export function useGroupDetails(groupId: string) {
    return useQuery({
        queryKey: ['group', groupId],
        queryFn: async () => {
            const data = await getGroupDetailsAction(groupId)
            return data as unknown as GroupDetails
        },
        enabled: !!groupId,
    })
}
