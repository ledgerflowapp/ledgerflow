import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { RecurringTransaction } from '@/types'

export type { RecurringTransaction }

export function useRecurringTransactions() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['recurring-transactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recurring_transactions')
                .select(`
                    *,
                    category:categories(name, icon),
                    account:accounts(name, type)
                `)
                .order('next_run_date', { ascending: true })

            if (error) throw error
            return data as unknown as RecurringTransaction[]
        },
    })
}
