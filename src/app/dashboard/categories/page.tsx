import type { Metadata } from 'next'
import { CategoriesContent } from '@/components/finance/CategoriesContent'

export const metadata: Metadata = {
    title: 'Categories',
    description: 'Manage income and expense categories',
}

export default function CategoriesPage() {
    return <CategoriesContent />
}
