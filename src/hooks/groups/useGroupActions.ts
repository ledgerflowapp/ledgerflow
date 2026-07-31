import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkGhostToFriendAction } from '@/lib/actions/groups'
import { toast } from 'sonner'

interface LinkGhostMemberParams {
    groupId: string
    ghostMemberId: string
    friendUserId: string
}

export function useLinkGhostMember() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ groupId, ghostMemberId, friendUserId }: LinkGhostMemberParams) => {
            return await linkGhostToFriendAction(groupId, ghostMemberId, friendUserId)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] })
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            toast.success('Member linked successfully')
        },
        onError: (error: any) => {
            console.error('Error linking member:', error)
            toast.error(error.message || 'Failed to link member')
        },
    })
}
