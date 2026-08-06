import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGoalAction } from '@/lib/actions/goals'
import { rupeesToPaise } from '@/lib/currency'
import { toast } from '@/components/ui/toast'

interface AddGoalParams {
    name: string
    target_amount: number
    deadline: Date
}

export function useAddGoal() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: AddGoalParams) => {
            const amountInPaise = rupeesToPaise(params.target_amount)

            return await createGoalAction({
                name: params.name,
                targetAmount: amountInPaise,
                deadline: params.deadline,
            })
        },
        onSuccess: () => {
            toast.success('Goal added successfully')
            queryClient.invalidateQueries({ queryKey: ['goals'] })
        },
        onError: (error: Error | { message?: string }) => {
            toast.error(`Failed to add goal: ${error.message}`)
        },
    })
}
