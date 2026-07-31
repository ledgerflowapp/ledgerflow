import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addRecurringTransaction } from '@/lib/actions/recurring'
import { toast } from 'sonner'

interface AddRecurringTransactionParams {
    name: string
    amount: number
    flow: 'IN' | 'OUT'
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    start_date: string
    next_run_date: string
    category_id?: string
    account_id?: string
    active?: boolean
    note?: string
}

export function useAddRecurringTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: AddRecurringTransactionParams) => {
            return await addRecurringTransaction(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
            toast.success('Recurring transaction created')
        },
        onError: (error) => {
            toast.error(`Failed to create: ${error.message}`)
        },
    })
}
