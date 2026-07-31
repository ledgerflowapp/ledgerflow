import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBusinesses, createBusiness } from '@/lib/actions/businesses'
import { toast } from 'sonner'

export interface Business {
    id: string
    name: string
    created_at: string
}

export function useBusinesses() {
    return useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {
            return await getBusinesses() as Business[]
        },
    })
}

export function useCreateBusiness() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name: string) => {
            return await createBusiness(name) as Business
        },
        onSuccess: () => {
            toast.success('Business created')
            queryClient.invalidateQueries({ queryKey: ['businesses'] })
        },
        onError: (error) => {
            toast.error(`Failed to create business: ${error.message}`)
        },
    })
}
