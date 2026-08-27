import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateContact } from '@/lib/actions/contacts'
import { toast } from '@/components/ui/toast'
import { Contact } from '@/types'

type UpdateContactParams = Partial<Contact> & { id: string }

export function useUpdateContact() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: UpdateContactParams) => {
            return await updateContact(params)
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['personal-people'] })
            queryClient.invalidateQueries({ queryKey: ['contact', data.id] })

            toast.success('Contact updated successfully')
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
}
