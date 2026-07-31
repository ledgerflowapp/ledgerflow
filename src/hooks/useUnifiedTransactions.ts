import { useQuery } from '@tanstack/react-query'
import { getUnifiedTransactionsAction } from '@/lib/actions/transactions'
import { TransactionWithJoins } from '@/types'

export function useUnifiedTransactions() {
    return useQuery({
        queryKey: ['unified-transactions'],
        queryFn: async () => {
            const data = await getUnifiedTransactionsAction()
            return data as unknown as TransactionWithJoins[]
        },
    })
}
