'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Icon } from "@/components/ui/icon"
import { LoaderIcon, Shield02Icon, Alert01Icon } from "@hugeicons/core-free-icons"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/hooks/use-profile'
import { authClient } from '@/lib/auth-client'
import { toast } from '@/components/ui/toast'
import { useState } from 'react'

export function SecuritySection() {
    const { profile, updateProfile } = useProfile()
    const [isLinkingGoogle, setIsLinkingGoogle] = useState(false)
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [updatingPrivacy, setUpdatingPrivacy] = useState<string | null>(null)

    const handleLinkGoogle = async () => {
        setIsLinkingGoogle(true)
        try {
            await authClient.signIn.social({ provider: 'google' })
        } catch (error) {
            console.error('Error linking Google:', error)
            toast.error('Failed to link Google account')
            setIsLinkingGoogle(false)
        }
    }

    const handleUpdateEmail = async () => {
        if (!newEmail) return
        setIsUpdatingEmail(true)
        try {
            await authClient.changeEmail({ newEmail })
            toast.success('Confirmation email sent! Please check your inbox.')
            setNewEmail('')
        } catch (error: any) {
            console.error('Error updating email:', error)
            toast.error(error.message || 'Failed to update email')
        } finally {
            setIsUpdatingEmail(false)
        }
    }

    const handlePrivacyUpdate = (key: 'discoverable_by_phone' | 'discoverable_by_username', value: boolean) => {
        setUpdatingPrivacy(key)
        updateProfile.mutate({ [key]: value }, {
            onSuccess: () => {
                toast.success('Privacy settings updated')
                setUpdatingPrivacy(null)
            },
            onError: () => {
                toast.error('Failed to update privacy settings')
                setUpdatingPrivacy(null)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                    Manage your security preferences and discoverability.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {profile && !profile.email && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10 p-4 sm:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30 shrink-0">
                                <Icon icon={Alert01Icon} className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="flex-1 space-y-4 w-full">
                                <div className="space-y-1">
                                    <h4 className="font-medium text-amber-900 dark:text-amber-500 text-base">Account Security Warning</h4>
                                    <p className="text-sm text-amber-800/90 dark:text-amber-500/90 leading-relaxed">
                                        Your account is currently only linked to this device/phone number. To ensure you don't lose access, please link an email address.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 pt-2 w-full">
                                    <div className="flex flex-col sm:flex-row w-full gap-2">
                                        <Input
                                            placeholder="name@example.com"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="bg-white/50 dark:bg-black/20 border-amber-200 dark:border-amber-800 min-h-12 sm:min-h-10 flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={handleUpdateEmail}
                                            disabled={isUpdatingEmail || !newEmail}
                                            className="border-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:hover:bg-amber-900/30 min-h-12 sm:min-h-10 shrink-0"
                                        >
                                            {isUpdatingEmail ? <Icon icon={LoaderIcon} className="h-4 w-4 animate-spin" /> : 'Link Email'}
                                        </Button>
                                    </div>

                                    <div className="relative flex items-center justify-center py-1">
                                        <span className="text-xs text-amber-800/60 font-medium px-2 bg-amber-50 dark:bg-transparent z-10">OR</span>
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-amber-200 dark:border-amber-800/50"></div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={handleLinkGoogle}
                                        disabled={isLinkingGoogle}
                                        className="w-full border-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:hover:bg-amber-900/30 min-h-12 sm:min-h-10"
                                    >
                                        {isLinkingGoogle ? <Icon icon={LoaderIcon} className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Link Google Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2 text-base">
                        <Icon icon={Shield02Icon} className="h-5 w-5" />
                        Discoverability
                    </h3>
                    <div className="grid gap-4 @md:grid-cols-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 shadow-sm bg-card">
                            <div className="space-y-1">
                                <Label htmlFor="view-phone" className="text-base">Phone Number</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow others to find you by your phone number
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 min-h-11">
                                {updatingPrivacy === 'discoverable_by_phone' && <Icon icon={LoaderIcon} className="h-4 w-4 animate-spin text-muted-foreground" />}
                                <Switch
                                    id="view-phone"
                                    checked={profile?.discoverable_by_phone || false}
                                    onCheckedChange={(checked) => handlePrivacyUpdate('discoverable_by_phone', checked)}
                                    disabled={!!updatingPrivacy}
                                    className="data-[state=checked]:bg-primary h-6 w-11"
                                    style={{ transform: 'scale(1.1)' }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 shadow-sm bg-card">
                            <div className="space-y-1">
                                <Label htmlFor="view-username" className="text-base">Username</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow others to find you by your @username
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 min-h-11">
                                {updatingPrivacy === 'discoverable_by_username' && <Icon icon={LoaderIcon} className="h-4 w-4 animate-spin text-muted-foreground" />}
                                <Switch
                                    id="view-username"
                                    checked={profile?.discoverable_by_username || false}
                                    onCheckedChange={(checked) => handlePrivacyUpdate('discoverable_by_username', checked)}
                                    disabled={!!updatingPrivacy}
                                    className="data-[state=checked]:bg-primary h-6 w-11"
                                    style={{ transform: 'scale(1.1)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
