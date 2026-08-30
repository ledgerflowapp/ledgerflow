'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/components/ui/toast'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Icon } from "@/components/ui/icon";
import { LoaderIcon } from "@hugeicons/core-free-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import dynamic from 'next/dynamic'

const IconPicker = dynamic(() => import('@/components/finance/IconPicker').then(mod => mod.IconPicker), { ssr: false })

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    icon: z.string().min(1, 'Icon is required'),
    type: z.enum(['INCOME', 'EXPENSE']),
})

interface CategoryDrawerProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    initialData?: z.infer<typeof categorySchema> & { id: string }
}

export function CategoryDrawer({
    children,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    initialData
}: CategoryDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = setControlledOpen ?? setInternalOpen

    const queryClient = useQueryClient()
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            icon: 'Wallet01Icon',
            type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                icon: initialData.icon,
                type: initialData.type,
            })
        } else {
            form.reset({
                name: '',
                icon: 'Wallet01Icon',
                type: 'EXPENSE',
            })
        }
    }, [initialData, form, open])

    const handleSubmit = async (values: z.infer<typeof categorySchema>) => {
        setIsPending(true)
        try {
            if (initialData?.id) {
                await updateCategory({ id: initialData.id, ...values })
                toast.success('Category updated')
            } else {
                await createCategory(values)
                toast.success('Category created')
            }

            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setOpen(false)
            form.reset()
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error('An unknown error occurred')
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            {children && <DrawerTrigger render={children as React.ReactElement} />}
            <DrawerContent className="max-h-[90dvh]">
                <div className="mx-auto w-full max-w-sm flex flex-col min-h-0 max-h-[90dvh]">
                    <DrawerHeader className="shrink-0">
                        <DrawerTitle>{initialData ? 'Edit Category' : 'Add Category'}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pb-8 overflow-y-auto flex-1 min-h-0">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Groceries, Rent, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="icon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Icon</FormLabel>
                                                <FormControl>
                                                    <IconPicker value={field.value} onChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select items={[ {value: 'EXPENSE', label: 'Expense'}, {value: 'INCOME', label: 'Income'} ]} onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="EXPENSE">Expense</SelectItem>
                                                        <SelectItem value="INCOME">Income</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Icon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />}
                                    {initialData ? 'Update Category' : 'Create Category'}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
