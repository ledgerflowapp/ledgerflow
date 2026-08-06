import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContact } from '@/lib/actions/contacts'
import { toast } from '@/components/ui/toast'

export function useDeleteContact() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            return await deleteContact(id)
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['personal-people'] })
            queryClient.removeQueries({ queryKey: ['contact', id] })

            toast.success('Contact deleted successfully')
        },
        onError: (error) => {
            toast.error(`Failed to delete contact: ${error.message}`)
        },
    })
}
