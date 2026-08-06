'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { acceptContactInviteAction } from '@/lib/actions/friends'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface PageProps {
    params: Promise<{
        token: string
    }>
}

export default function ContactInvitePage(props: PageProps) {
    const params = use(props.params)
    const { token } = params
    const router = useRouter()

    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING')
    const [message, setMessage] = useState('Connecting you as a friend...')

    useEffect(() => {
        const acceptInvite = async () => {
            try {
                const data = await acceptContactInviteAction(token)

                setStatus('SUCCESS')
                setMessage(`Success! You are now friends with ${data.owner_name}. Redirecting...`)

                // Redirect user specified suggestion to dashboard/friends
                setTimeout(() => {
                    router.push('/dashboard/friends')
                }, 2000)

            } catch (err: any) {
                console.error('Error accepting invite:', err)
                if (err.message === 'Unauthorized') {
                    router.push(`/auth?returnUrl=/invite/contact/${token}`)
                    return
                }
                setStatus('ERROR')
                setMessage(err.message || 'Invalid or expired link.')
            }
        }

        acceptInvite()
    }, [token, router])

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="max-w-md w-full p-8 text-center space-y-6">
                {status === 'LOADING' && (
                    <div className="flex flex-col items-center gap-4 text-primary">
                        <Loader2 className="h-12 w-12 animate-spin" />
                        <h2 className="text-xl font-semibold">{message}</h2>
                        <p className="text-sm text-muted-foreground">
                            Accepting connects you as a friend with the inviter.
                        </p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="flex flex-col items-center gap-4 text-green-600 dark:text-green-500">
                        <CheckCircle2 className="h-16 w-16" />
                        <h2 className="text-xl font-semibold">{message}</h2>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="flex flex-col items-center gap-4 text-destructive">
                        <XCircle className="h-16 w-16" />
                        <h2 className="text-xl font-semibold">Invite Failed</h2>
                        <p className="text-muted-foreground text-sm">{message}</p>

                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-6 font-medium text-primary hover:underline"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
