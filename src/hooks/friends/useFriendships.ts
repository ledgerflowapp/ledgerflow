import { useQuery } from '@tanstack/react-query'
import { getFriendshipsAction } from '@/lib/actions/friends'

export interface Friend {
    friendship_id: string
    profile: {
        id: string
        full_name: string | null
        avatar_url: string | null
        email?: string
    }
}

export function useFriendships() {
    return useQuery({
        queryKey: ['friendships'],
        queryFn: async () => {
            const data = await getFriendshipsAction()
            return data as Friend[]
        },
    })
}
