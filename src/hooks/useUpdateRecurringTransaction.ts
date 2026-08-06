import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRecurringTransaction } from '@/lib/actions/recurring'
import { toast } from '@/components/ui/toast'

export function useUpdateRecurringTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string
            data: Parameters<typeof updateRecurringTransaction>[1]
        }) => {
            return await updateRecurringTransaction(id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['personal-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['unified-transactions'] })
        },
        onError: (error: Error) => {
            toast.error(`Failed to update recurring payment: ${error.message}`)
        },
    })
}
