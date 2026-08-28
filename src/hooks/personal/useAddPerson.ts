import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPersonalPerson } from '@/lib/actions/contacts'
import { toast } from '@/components/ui/toast'

export function useAddPerson() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newPerson: { name: string; phone?: string; image_url?: string; }) => {
            const result = await addPersonalPerson(newPerson)
            if ('error' in result) {
                throw new Error(result.error)
            }
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personal-people'] })
            toast.success('Person added')
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })
}
