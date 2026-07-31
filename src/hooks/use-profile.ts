import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession } from '@/lib/auth-client'
import { toast } from 'sonner'
import { Profile } from '@/types'

export type { Profile }

export function useProfile() {
    const queryClient = useQueryClient()

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await getSession()
            const user = res?.data?.user
            if (!user) return null

            return {
                id: user.id,
                full_name: user.name || null,
                username: null,
                business_name: null,
                phone: null,
                email: user.email || null,
                avatar_url: user.image || null,
                currency_symbol: '₹',
                discoverable_by_phone: true,
                discoverable_by_username: true,
            } as Profile
        }
    })

    const updateProfile = useMutation({
        mutationFn: async (_updates: Partial<Profile>) => {
            // Profile updates managed via settings server actions
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            toast.success('Profile updated successfully')
        },
        onError: (error) => {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        }
    })

    return {
        profile,
        isLoading,
        error,
        updateProfile
    }
}
