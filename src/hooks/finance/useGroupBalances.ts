import { useQuery } from '@tanstack/react-query'
import { getGroupBalancesAction } from '@/lib/actions/groups'
import { GroupMember } from '@/types'

export function useGroupBalances(groupId: string, members: (GroupMember & { profiles?: { full_name: string | null; avatar_url: string | null } })[]) {
    return useQuery({
        queryKey: ['group-balances', groupId],
        queryFn: async () => {
            return await getGroupBalancesAction(groupId)
        },
        enabled: !!groupId && members.length > 0,
    })
}
