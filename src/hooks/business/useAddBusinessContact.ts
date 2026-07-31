import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addBusinessContact } from '@/lib/actions/contacts'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { Contact } from '@/types'

export function useAddBusinessContact() {
    const queryClient = useQueryClient()
    const { currentBusinessId } = useAppStore()

    return useMutation({
        mutationFn: async (newContact: { name: string; phone?: string; type: Contact['type']; image_url?: string; }) => {
            if (!currentBusinessId) throw new Error('No business selected')

            return await addBusinessContact({
                ...newContact,
                businessId: currentBusinessId,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact added')
        },
        onError: (error) => {
            toast.error(`Failed to add contact: ${error.message}`)
        },
    })
}
