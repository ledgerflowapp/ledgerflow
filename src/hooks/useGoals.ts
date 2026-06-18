import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/types'

export type { Goal }

export function useGoals() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('deadline', { ascending: true })

            if (error) throw error
            return data as Goal[]
        },
    })
}
