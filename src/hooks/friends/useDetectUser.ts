import { useMutation } from '@tanstack/react-query'
import { detectUserByPhoneAction } from '@/lib/actions/friends'

export interface DetectedUser {
    id: string
    full_name: string | null
    avatar_url: string | null
}

export function useDetectUser() {
    return useMutation({
        mutationFn: async (phone: string) => {
            const data = await detectUserByPhoneAction(phone)
            return data as DetectedUser | null
        }
    })
}
