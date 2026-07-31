import { useQuery } from '@tanstack/react-query'
import { getPersonalPeople } from '@/lib/actions/contacts'
import { Contact } from '@/types'

interface PersonalPeopleFilters {
    sortBy?: 'LATEST' | 'MOST_ACTIVE'
    timeFilter?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
}

export function usePersonalPeople(filters: PersonalPeopleFilters = {}) {
    return useQuery({
        queryKey: ['personal-people', filters],
        queryFn: async () => {
            return await getPersonalPeople(filters) as Contact[]
        }
    })
}
