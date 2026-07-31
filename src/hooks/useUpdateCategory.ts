import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCategory } from '@/lib/actions/categories'
import { toast } from 'sonner'

interface UpdateCategoryParams {
    id: string
    budget_limit: number
}

export function useUpdateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, budget_limit }: UpdateCategoryParams) => {
            return await updateCategory({ id, budgetLimit: budget_limit })
        },
        onSuccess: () => {
            toast.success('Budget updated')
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (error) => {
            toast.error(`Failed to update budget: ${error.message}`)
        },
    })
}
