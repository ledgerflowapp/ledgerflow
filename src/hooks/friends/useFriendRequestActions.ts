import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    sendFriendRequestAction,
    acceptInAppRequestAction,
    rejectInAppRequestAction,
} from '@/lib/actions/friends'

export function useFriendRequestActions() {
    const queryClient = useQueryClient()

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
        queryClient.invalidateQueries({ queryKey: ['friendships'] })
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['personal-people'] })
    }

    const sendRequest = useMutation({
        mutationFn: async ({ targetUserId, contactId }: { targetUserId: string; contactId?: string }) => {
            return await sendFriendRequestAction({ targetUserId, contactId })
        },
        onSuccess: invalidateAll
    })

    const acceptRequest = useMutation({
        mutationFn: async (friendshipId: string) => {
            return await acceptInAppRequestAction(friendshipId)
        },
        onSuccess: invalidateAll
    })

    const rejectRequest = useMutation({
        mutationFn: async (friendshipId: string) => {
            return await rejectInAppRequestAction(friendshipId)
        },
        onSuccess: invalidateAll
    })

    return {
        sendRequest,
        acceptRequest,
        rejectRequest
    }
}
