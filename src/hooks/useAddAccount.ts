import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount } from '@/lib/actions/accounts'
import { toast } from '@/components/ui/toast'

interface AddAccountParams {
    name: string
    type: 'CASH' | 'BANK' | 'WALLET' | 'OTHER'
    balance: number
}

export function useAddAccount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newAccount: AddAccountParams) => {
            return await createAccount(newAccount)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            toast.success('Account created')
        },
        onError: (error) => {
            toast.error('Failed to create account')
            console.error(error)
        },
    })
}
