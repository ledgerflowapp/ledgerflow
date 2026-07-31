import { useQuery } from '@tanstack/react-query'
import { getMonthlyCategorySpend } from '@/lib/actions/categories'

export interface CategorySpend {
    category_name: string
    category_color: string
    total_spent: number
}

export function useMonthlyCategorySpend(month: number, year: number) {
    return useQuery({
        queryKey: ['analytics', month, year],
        queryFn: async () => {
            return await getMonthlyCategorySpend(month, year) as CategorySpend[]
        },
    })
}
