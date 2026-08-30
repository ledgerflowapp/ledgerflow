import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfileData } from '@/lib/actions/profile'
import { toast } from '@/components/ui/toast'
import { Profile } from '@/types'

export type { Profile }

export function useProfile() {
    const queryClient = useQueryClient()

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const data = await getProfile()
            return data
        }
    })

    const updateProfile = useMutation({
        mutationFn: async (updates: Partial<Profile>) => {
            const res = await updateProfileData(updates)
            if (!res.success) throw new Error('Failed to update profile')
            return res
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
