import { format, isToday, isYesterday, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns'

export type TimeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
export type SortOption = 'LATEST' | 'OLDEST' | 'HIGHEST' | 'LOWEST'

export function filterAndSortTransactions<T extends { date: string | Date; amount: number }>(
    items: T[] | undefined | null,
    timeFilter: TimeFilter,
    sortBy: SortOption
): (T & { parsedDate: Date; timestamp: number })[] {
    if (!items || items.length === 0) return []

    // Pre-parse dates once per item to avoid O(N log N) date string parsing overhead during sort and filter
    const parsed = items.map(t => {
        const parsedDate = typeof t.date === 'string' ? new Date(t.date) : t.date
        return {
            ...t,
            parsedDate,
            timestamp: parsedDate.getTime()
        }
    })

    let result = parsed

    // Apply Time Filter
    const now = new Date()
    if (timeFilter === 'TODAY') {
        const start = startOfDay(now)
        result = result.filter(t => isAfter(t.parsedDate, start))
    } else if (timeFilter === 'WEEK') {
        const start = startOfWeek(now)
        result = result.filter(t => isAfter(t.parsedDate, start))
    } else if (timeFilter === 'MONTH') {
        const start = startOfMonth(now)
        result = result.filter(t => isAfter(t.parsedDate, start))
    } else if (timeFilter === 'YEAR') {
        const start = startOfYear(now)
        result = result.filter(t => isAfter(t.parsedDate, start))
    }

    // Apply Sorting
    result.sort((a, b) => {
        switch (sortBy) {
            case 'LATEST':
                return b.timestamp - a.timestamp
            case 'OLDEST':
                return a.timestamp - b.timestamp
            case 'HIGHEST':
                return b.amount - a.amount
            case 'LOWEST':
                return a.amount - b.amount
            default:
                return 0
        }
    })

    return result
}

export function formatTransactionDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date

    if (isToday(d)) {
        return format(d, 'h:mm a')
    }

    if (isYesterday(d)) {
        return `Yesterday, ${format(d, 'h:mm a')}`
    }

    return format(d, 'dd/MM/yyyy, h:mm a')
}
