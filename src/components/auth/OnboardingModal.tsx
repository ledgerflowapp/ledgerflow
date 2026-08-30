'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Icon } from "@/components/ui/icon";
import { LoaderIcon } from "@hugeicons/core-free-icons";
import { toast } from '@/components/ui/toast'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/hooks/use-profile'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

const usernameSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

type UsernameFormValues = z.infer<typeof usernameSchema>

export function OnboardingModal() {
    const { profile, isLoading, updateProfile } = useProfile()
    const [isOpen, setIsOpen] = useState(false)
    const [phase, setPhase] = useState<'username' | 'wizard'>('username')

    // Open modal if profile loaded and username is missing
    useEffect(() => {
        if (!isLoading && profile && !profile.username) {
            setIsOpen(true)
        }
    }, [isLoading, profile])

    const form = useForm<UsernameFormValues>({
        resolver: zodResolver(usernameSchema),
        defaultValues: {
            username: '',
        },
    })

    const onUsernameSubmit = (data: UsernameFormValues) => {
        updateProfile.mutate({ username: data.username }, {
            onSuccess: () => {
                toast.success('Username claimed successfully!')
                setPhase('wizard')
            },
            onError: (error: any) => {
                if (error.code === '23505') {
                    form.setError('username', {
                        type: 'manual',
                        message: 'This username is already taken. Please choose another.',
                    })
                } else {
                    toast.error('Failed to update username. Please try again.')
                }
            }
        })
    }

    const handleSkipUsername = () => {
        setPhase('wizard')
    }

    if (isLoading || !profile?.id) return null

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} disablePointerDismissal={true} modal={true}>
            <DialogContent className="sm:max-w-md">
                {phase === 'username' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Choose a Username</DialogTitle>
                            <DialogDescription>
                                Set a unique username to make it easier for others to find you on LedgerFlow.
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onUsernameSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    placeholder="username"
                                                    autoComplete="off"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={handleSkipUsername}>
                                        Skip for now
                                    </Button>
                                    <Button type="submit" disabled={updateProfile.isPending}>
                                        {updateProfile.isPending && (
                                            <Icon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Claim Username
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </>
                ) : (
                    <OnboardingWizard onComplete={() => setIsOpen(false)} />
                )}
            </DialogContent>
        </Dialog>
    )
}
