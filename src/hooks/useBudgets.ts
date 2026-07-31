import { useQuery } from '@tanstack/react-query'
import { getBudgets } from '@/lib/actions/categories'

export interface BudgetCategory {
    id: string
    name: string
    icon: string
    budget_limit: number | null
    spent: number
}

export function useBudgets() {
    return useQuery({
        queryKey: ['budgets'],
        queryFn: async () => {
            return await getBudgets() as BudgetCategory[]
        },
    })
}
