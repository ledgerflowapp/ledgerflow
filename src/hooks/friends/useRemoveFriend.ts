import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeFriendAction } from '@/lib/actions/friends'
import { toast } from '@/components/ui/toast'

export function useRemoveFriend() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (friendId: string) => {
            return await removeFriendAction(friendId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendships'] })
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['personal-people'] })
            toast.success('Friend disconnected successfully')
        },
        onError: (error: any) => {
            toast.error(`Failed to unfriend: ${error.message}`)
        },
    })
}
