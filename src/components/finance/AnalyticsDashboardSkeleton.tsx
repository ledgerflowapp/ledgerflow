import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsDashboardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
            </CardContent>
        </Card>
    )
}
