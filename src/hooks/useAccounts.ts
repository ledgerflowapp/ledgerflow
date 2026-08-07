import { useQuery } from '@tanstack/react-query'
import { getAccounts } from '@/lib/actions/accounts'
import { getDefaultAccount } from '@/lib/account-utils'

export { getDefaultAccount }

export interface Account {
    id: string
    name: string
    type: 'CASH' | 'BANK' | 'WALLET' | 'OTHER'
    balance: number
    is_default: boolean
}

export function useAccounts() {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            return await getAccounts() as Account[]
        },
    })
}

