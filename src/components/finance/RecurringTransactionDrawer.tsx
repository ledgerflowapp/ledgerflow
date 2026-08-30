'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/ui/toast'
import { useAddRecurringTransaction } from '@/hooks/useAddRecurringTransaction'
import { useUpdateRecurringTransaction } from '@/hooks/useUpdateRecurringTransaction'
import { useAccounts } from '@/hooks/useAccounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from "@/components/ui/icon";
import { LoaderIcon, Edit04Icon, PlusIcon } from "@hugeicons/core-free-icons";
import { useBudgets } from '@/hooks/useBudgets'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecurringTransaction } from '@/types'
import { paiseToRupees } from '@/lib/currency'

export const recurringSchema = z.object({
    amount: z
        .number({ message: 'Please enter an amount' })
        .or(z.nan())
        .refine((val) => !isNaN(val) && val >= 1, {
            message: 'Amount must be greater than zero',
        }),
    name: z.string().min(1, 'Please provide a title for this transaction'),
    note: z.string().optional(),
    category_id: z.string().optional(),
    account_id: z.string().min(1, 'Please select an account'),
    start_date: z.coerce.date(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    schedule_mode: z.enum(['CALENDAR', 'FIXED_INTERVAL']),
    flow: z.enum(['IN', 'OUT']),
})

export function getFormDefaults(initialData?: RecurringTransaction | null) {
    const frequency = initialData?.frequency ?? 'MONTHLY'
    const schedule_mode = initialData?.schedule_mode ?? 'CALENDAR'
    const flow = initialData?.flow ?? 'OUT'

    return {
        amount: initialData ? paiseToRupees(initialData.amount).toNumber() : undefined,
        name: initialData?.name ?? '',
        note: initialData?.note ?? undefined,
        start_date: initialData ? new Date(initialData.start_date) : new Date(),
        frequency,
        schedule_mode,
        category_id: initialData?.category_id ?? undefined,
        account_id: initialData?.account_id ?? '',
        flow,
    }
}

export function RecurringTransactionDrawer({
    children,
    initialData,
}: {
    children?: React.ReactNode
    initialData?: RecurringTransaction | null
}) {
    const { data: budgets } = useBudgets()
    const { data: accounts } = useAccounts()
    const { mutate: addRecurring, isPending: isAdding } = useAddRecurringTransaction()
    const { mutate: updateRecurring, isPending: isUpdating } = useUpdateRecurringTransaction()
    const isPending = isAdding || isUpdating
    const [open, setOpen] = useState(false)
    const [flow, setFlow] = useState<'IN' | 'OUT'>(initialData?.flow || 'OUT')

    const isEdit = !!initialData

    const form = useForm<z.input<typeof recurringSchema>, any, z.infer<typeof recurringSchema>>({
        resolver: zodResolver(recurringSchema),
        defaultValues: getFormDefaults(initialData),
    })

    useEffect(() => {
        if (open) {
            form.reset(getFormDefaults(initialData))
            setFlow(initialData?.flow || 'OUT')
        }
    }, [open, initialData, form])

    const handleSubmit = async (values: z.infer<typeof recurringSchema>) => {
        if (!values.category_id && flow === 'OUT') {
            toast.error('Please select a category for this expense')
            return
        }

        if (isEdit && initialData) {
            updateRecurring(
                {
                    id: initialData.id,
                    data: {
                        ...values,
                        flow,
                        active: initialData.active,
                    },
                },
                {
                    onSuccess: () => {
                        setOpen(false)
                        toast.success('Subscription updated')
                    },
                }
            )
        } else {
            const data = {
                ...values,
                flow,
                next_run_date: values.start_date.toISOString(),
            }

            addRecurring(
                { ...data, start_date: data.start_date.toISOString() },
                {
                    onSuccess: () => {
                        setOpen(false)
                        form.reset()
                        setFlow('OUT')
                        toast.success('Subscription added')
                    },
                }
            )
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            {children ? (
                <DrawerTrigger render={children as React.ReactElement} />
            ) : (
                <DrawerTrigger render={<Button size="sm" variant="outline" />}>
                    {isEdit ? <Icon icon={Edit04Icon} className="mr-2 h-4 w-4" /> : <Icon icon={PlusIcon} className="mr-2 h-4 w-4" />}
                    {isEdit ? 'Edit04Icon Subscription' : 'Add Subscription'}
                </DrawerTrigger>
            )}
            <DrawerContent className="max-h-[90dvh]">
                <div className="mx-auto w-full max-w-sm flex flex-col min-h-0 max-h-[90dvh]">
                    <DrawerHeader className="shrink-0">
                        <DrawerTitle>{isEdit ? 'Edit04Icon Recurring Payment' : 'Add Recurring Payment'}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pb-8 overflow-y-auto flex-1 min-h-0">
                        <Tabs value={flow} className="w-full mb-4" onValueChange={(v) => setFlow(v as 'IN' | 'OUT')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="OUT">Expense</TabsTrigger>
                                <TabsTrigger value="IN">Income</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount (₹)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    {...field}
                                                    value={field.value !== undefined && !Number.isNaN(field.value) ? field.value : ''}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value === '' ? NaN : Number(e.target.value))
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Frequency</FormLabel>
                                            <Select
                                                items={[
                                                    { value: 'DAILY', label: 'Daily' },
                                                    { value: 'WEEKLY', label: 'Weekly' },
                                                    { value: 'MONTHLY', label: 'Monthly' },
                                                    { value: 'YEARLY', label: 'Yearly' },
                                                ]}
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DAILY">Daily</SelectItem>
                                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="schedule_mode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Schedule Mode</FormLabel>
                                            <Select
                                                items={[
                                                    { value: 'CALENDAR', label: 'Calendar Date' },
                                                    { value: 'FIXED_INTERVAL', label: 'Fixed Interval' },
                                                ]}
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select schedule mode" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CALENDAR">Calendar Date (e.g. 31st of every month)</SelectItem>
                                                    <SelectItem value="FIXED_INTERVAL">Fixed Interval (e.g. Jan 31 → Feb 28 → Mar 28)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs text-muted-foreground">
                                                {field.value === 'CALENDAR'
                                                    ? 'Calendar: Always aligns to the target calendar day (restores to 31st after short months).'
                                                    : 'Fixed Interval: Advances relative to the actual run date.'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {flow === 'OUT' && (
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <FormControl>
                                                    <ToggleGroup
                                                        value={field.value ? [field.value] : []}
                                                        onValueChange={(val) => field.onChange(val[0] || undefined)}
                                                        className="justify-start flex-wrap gap-2"
                                                    >
                                                        {budgets?.map((cat) => (
                                                            <ToggleGroupItem
                                                                key={cat.id}
                                                                value={cat.id}
                                                                aria-label={cat.name}
                                                                className="h-9 px-3 border border-input data-pressed:bg-primary data-pressed:text-primary-foreground"
                                                            >
                                                                <span className="mr-2">{cat.icon}</span>
                                                                {cat.name}
                                                            </ToggleGroupItem>
                                                        ))}
                                                    </ToggleGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="account_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account</FormLabel>
                                            <FormControl>
                                                <ToggleGroup
                                                    value={field.value ? [field.value] : []}
                                                    onValueChange={(val) => field.onChange(val[0] || undefined)}
                                                    className="justify-start flex-wrap gap-2"
                                                >
                                                    {accounts?.map((acc) => (
                                                        <ToggleGroupItem
                                                            key={acc.id}
                                                            value={acc.id}
                                                            aria-label={acc.name}
                                                            className="h-9 px-3 border border-input data-pressed:bg-primary data-pressed:text-primary-foreground"
                                                        >
                                                            {acc.name}
                                                        </ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {!isEdit && (
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date</FormLabel>
                                                <DateTimePicker
                                                    date={field.value as Date | undefined}
                                                    setDate={field.onChange}
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Netflix, Rent, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Note (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Shared plan, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Icon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEdit ? 'Save Changes' : 'Save Subscription'}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
