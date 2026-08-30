'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icon } from "@/components/ui/icon"
import { LoaderIcon, UserIcon, PhoneIcon, AtSignIcon, PencilIcon } from "@hugeicons/core-free-icons"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/hooks/use-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional().or(z.literal('')),
    avatar_url: z.string().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileSection() {
    const { profile, isLoading: isProfileLoading, updateProfile } = useProfile()
    const [isEditing, setIsEditing] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            avatar_url: '',
        },
        mode: 'onChange'
    })

    useEffect(() => {
        if (profile) {
            form.reset({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || '',
            })
        }
    }, [profile, form, isEditing])

    const onSubmit = (data: ProfileFormValues) => {
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
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || '',
            })
        }
    }

    if (isProfileLoading) {
        return (
            <Card>
                <div className="flex justify-center p-12">
                    <Icon icon={LoaderIcon} className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        Manage your personal information and contact details.
                    </CardDescription>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="min-h-11 sm:min-h-9 shrink-0">
                        <Icon icon={PencilIcon} className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-8">
                {isEditing ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="avatar_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Profile Picture</FormLabel>
                                        <FormControl>
                                            <AvatarUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                name={form.watch('full_name')}
                                                folder="profiles"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base">Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" className="min-h-12 sm:min-h-10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2 opacity-60">
                                    <Label className="text-base">Username</Label>
                                    <div className="relative">
                                        <Icon icon={AtSignIcon} className="absolute left-3 top-3.5 sm:top-2.5 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-10 min-h-12 sm:min-h-10 cursor-not-allowed"
                                            value={profile?.username || ''}
                                            disabled
                                        />
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Your username is unique and cannot be changed.
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base">Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" className="min-h-12 sm:min-h-10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

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
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-md">
                                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'UserIcon'} className="object-cover" />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2 text-center sm:text-left flex-1">
                                <h3 className="text-2xl font-bold leading-none tracking-tight">{profile?.full_name || 'No Name Set'}</h3>
                                <p className="text-sm text-muted-foreground">{profile?.email || 'No email linked'}</p>
                                
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 text-secondary-foreground mt-2 border">
                                    <Icon icon={AtSignIcon} className="h-3.5 w-3.5 opacity-70" />
                                    <span className="text-sm font-medium">{profile?.username}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</Label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border">
                                    <div className="bg-background p-2 rounded-md shadow-sm border">
                                        <Icon icon={UserIcon} className="h-4 w-4 text-foreground/70" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Full Name</span>
                                        <span className="text-sm font-medium">{profile?.full_name || 'Not set'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border">
                                    <div className="bg-background p-2 rounded-md shadow-sm border">
                                        <Icon icon={PhoneIcon} className="h-4 w-4 text-foreground/70" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">Phone Number</span>
                                        <span className="text-sm font-medium">{profile?.phone || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
