import { useQuery } from '@tanstack/react-query'
import { getTransactionsAction } from '@/lib/actions/transactions'
import { TransactionWithJoins } from '@/types'

export function useContactTransactions(contactId: string) {
    return useQuery({
        queryKey: ['transactions', 'contact', contactId],
        queryFn: async () => {
            const data = await getTransactionsAction({ contactId })
            return data as unknown as TransactionWithJoins[]
        },
        enabled: !!contactId,
    })
}
