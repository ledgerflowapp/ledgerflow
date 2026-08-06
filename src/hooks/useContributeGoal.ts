import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contributeGoalAction } from '@/lib/actions/goals'
import { rupeesToPaise } from '@/lib/currency'
import { toast } from '@/components/ui/toast'

interface ContributeGoalParams {
    id: string
    amount: number
}

export function useContributeGoal() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, amount }: ContributeGoalParams) => {
            // Convert amount from rupees (user input) to integer paise for DB storage
            const amountInPaise = rupeesToPaise(amount)

            return await contributeGoalAction({
                id,
                amount: amountInPaise,
            })
        },
        onSuccess: () => {
            toast.success('Added to goal!')
            queryClient.invalidateQueries({ queryKey: ['goals'] })
        },
        onError: (error: Error | { message?: string }) => {
            if (error.message?.includes('Contribution would exceed goal target')) {
                toast.error('Amount exceeds the remaining goal balance.')
            } else {
                toast.error(`Failed to update goal: ${error.message}`)
            }
        },
    })
}
