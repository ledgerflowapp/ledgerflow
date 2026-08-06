import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory } from '@/lib/actions/categories'
import { toast } from '@/components/ui/toast'

interface AddCategoryParams {
    name: string
    icon: string
    type: 'INCOME' | 'EXPENSE'
}

export function useAddCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: AddCategoryParams) => {
            return await createCategory(params)
        },
        onSuccess: () => {
            toast.success('Category added')
            queryClient.invalidateQueries({ queryKey: ['budgets'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (error) => {
            toast.error(`Failed to add category: ${error.message}`)
        },
    })
}
