import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecurringTransaction } from '@/lib/actions/recurring'
import { toast } from 'sonner'

export function useDeleteRecurringTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            return await deleteRecurringTransaction(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
            toast.success('Recurring transaction deleted')
        },
        onError: (error) => {
            toast.error(`Failed to delete: ${error.message}`)
        },
    })
}
