import { useQuery } from '@tanstack/react-query'
import { getFriendRequestsAction } from '@/lib/actions/friends'

export interface PendingFriendRequest {
    id: string // Friendship ID
    type: 'INCOMING' | 'OUTGOING'
    profile: {
        id: string
        full_name: string | null
        avatar_url: string | null
    }
}

export function useFriendRequests() {
    return useQuery({
        queryKey: ['friend-requests'],
        queryFn: async () => {
            const data = await getFriendRequestsAction()
            return data as PendingFriendRequest[]
        }
    })
}
