'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icon } from "@/components/ui/icon"
import { LoaderIcon, BuildingIcon, PencilIcon } from "@hugeicons/core-free-icons"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/hooks/use-profile'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'

const businessSchema = z.object({
    business_name: z.string().optional().or(z.literal('')),
})

type BusinessFormValues = z.infer<typeof businessSchema>

export function BusinessSection() {
    const { profile, isLoading: isProfileLoading, updateProfile } = useProfile()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm<BusinessFormValues>({
        resolver: zodResolver(businessSchema),
        defaultValues: {
            business_name: '',
        },
        mode: 'onChange'
    })

    useEffect(() => {
        if (profile) {
            form.reset({
                business_name: profile.business_name || '',
            })
        }
    }, [profile, form, isEditing])

    const onSubmit = (data: BusinessFormValues) => {
        updateProfile.mutate(data, {
            onSuccess: () => {
                setIsEditing(false)
            }
        })
    }

    const handleCancel = () => {
        setIsEditing(false)
        if (profile) {
            form.reset({
                business_name: profile.business_name || '',
            })
        }
    }

    if (isProfileLoading) {
        return null // Handled by ProfileSection or main layout
    }

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6 flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>
                        Manage your professional or business identity.
                    </CardDescription>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="min-h-11 sm:min-h-9 shrink-0">
                        <Icon icon={PencilIcon} className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6 px-0 sm:px-6">
                {isEditing ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="business_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Business Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Acme Inc." className="min-h-12 sm:min-h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="ghost" onClick={handleCancel} disabled={updateProfile.isPending} className="w-full sm:w-auto min-h-12 sm:min-h-10">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateProfile.isPending || !form.formState.isDirty}
                                    className="w-full sm:w-auto min-h-12 sm:min-h-10"
                                >
                                    {updateProfile.isPending && <Icon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border max-w-md">
                            <div className="bg-background p-2 rounded-md shadow-sm border">
                                <Icon icon={BuildingIcon} className="h-4 w-4 text-foreground/70" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Business Name</span>
                                <span className="text-sm font-medium">{profile?.business_name || 'Not set'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
