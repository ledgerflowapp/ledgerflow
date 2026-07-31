import { useQuery } from '@tanstack/react-query'
import { getBusinessContacts } from '@/lib/actions/contacts'
import { useAppStore } from '@/store/useAppStore'
import { Contact } from '@/types'

export function useBusinessContacts() {
    const { currentBusinessId } = useAppStore()

    return useQuery({
        queryKey: ['contacts', currentBusinessId],
        queryFn: async () => {
            if (!currentBusinessId) return []
            return await getBusinessContacts(currentBusinessId) as Contact[]
        },
        enabled: !!currentBusinessId,
    })
}
