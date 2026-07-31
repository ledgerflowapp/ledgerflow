import { useQuery } from '@tanstack/react-query'
import { getRecurringTransactions } from '@/lib/actions/recurring'
import { RecurringTransaction } from '@/types'

export type { RecurringTransaction }

export function useRecurringTransactions() {
    return useQuery({
        queryKey: ['recurring-transactions'],
        queryFn: async () => {
            return await getRecurringTransactions()
        },
    })
}
