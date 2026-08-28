import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addBusinessContact } from '@/lib/actions/contacts'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/components/ui/toast'
import { Contact } from '@/types'

export function useAddBusinessContact() {
    const queryClient = useQueryClient()
    const { currentBusinessId } = useAppStore()

    return useMutation({
        mutationFn: async (newContact: { name: string; phone?: string; type: Contact['type']; image_url?: string; }) => {
            if (!currentBusinessId) throw new Error('No business selected')

            const result = await addBusinessContact({
                ...newContact,
                businessId: currentBusinessId,
            })
            
            if ('error' in result) {
                throw new Error(result.error)
            }
            
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact added')
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
}
