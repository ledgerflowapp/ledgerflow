'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useContributeGoal } from '@/hooks/useContributeGoal'
import { Icon } from "@/components/ui/icon";
import { LoaderIcon, PlusIcon } from "@hugeicons/core-free-icons";

interface ContributeGoalDrawerProps {
    goalId: string
    goalName: string
    children: React.ReactNode
}

export function ContributeGoalDrawer({ goalId, goalName, children }: ContributeGoalDrawerProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const { mutate: contribute, isPending } = useContributeGoal()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const val = parseFloat(amount)
        if (!val || val <= 0) return

        contribute({ id: goalId, amount: val }, {
            onSuccess: () => {
                setOpen(false)
                setAmount('')
            }
        })
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger render={children as React.ReactElement} />
            <DrawerContent className="max-h-[90dvh]">
                <div className="mx-auto w-full max-w-sm flex flex-col min-h-0 max-h-[90dvh]">
                    <DrawerHeader className="shrink-0">
                        <DrawerTitle>Add to {goalName}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pb-8 overflow-y-auto flex-1 min-h-0">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Amount to Save</Label>
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending || !amount}>
                                {isPending && <Icon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />}
                                Add Funds
                            </Button>
                        </form>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
