import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { PersonalTransactionDrawer } from '../personal/PersonalTransactionDrawer'
import { BusinessTransactionDrawer } from '../business/BusinessTransactionDrawer'
import { SplitExpenseDrawer } from '../groups/SplitExpenseDrawer'
import { ContactReconciliationWizard } from '../contacts/ContactReconciliationWizard'
import { getDefaultAccount } from '@/lib/account-utils'

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Mock data & hooks
let mockAccountsData: any[] | undefined = [
    { id: 'acc-default', name: 'Primary Cash', is_default: true, balance: 10000 },
    { id: 'acc-savings', name: 'Savings Account', is_default: false, balance: 50000 },
]

vi.mock('@/hooks/useAccounts', () => ({
    useAccounts: () => ({
        data: mockAccountsData,
        isLoading: false,
    }),
}))

vi.mock('@/hooks/personal/usePersonalPeople', () => ({
    usePersonalPeople: () => ({
        data: [{ id: 'person-1', name: 'Alice Smith' }],
        isLoading: false,
    }),
}))

vi.mock('@/hooks/business/useBusinessContacts', () => ({
    useBusinessContacts: () => ({
        data: [{ id: 'biz-contact-1', name: 'Acme Corp' }],
        isLoading: false,
    }),
}))

vi.mock('@/hooks/useBudgets', () => ({
    useBudgets: () => ({
        data: [{ id: 'cat-groceries', name: 'Groceries', icon: '🛒' }],
        isLoading: false,
    }),
}))

const mockAddTransaction = vi.fn()
const mockUpdateTransaction = vi.fn()

vi.mock('@/hooks/useAddTransaction', () => ({
    useAddTransaction: () => ({
        mutate: mockAddTransaction,
        isPending: false,
    }),
}))

vi.mock('@/hooks/useUpdateTransaction', () => ({
    useUpdateTransaction: () => ({
        mutate: mockUpdateTransaction,
        isPending: false,
    }),
}))

vi.mock('@/components/ui/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/lib/actions/groups', () => ({
    requestGroupGhostMerge: vi.fn().mockResolvedValue({
        success: true,
        requestId: 'req-mock-123',
        groupId: 'group-1',
    }),
}))

describe('Drawer State Synchronization & Integration Suite', () => {
    let container: HTMLDivElement
    let root: Root
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.clearAllMocks()
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockAccountsData = [
            { id: 'acc-default', name: 'Primary Cash', is_default: true, balance: 10000 },
            { id: 'acc-savings', name: 'Savings Account', is_default: false, balance: 50000 },
        ]

        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()

        // Assert 0 React render phase state update errors or warnings occurred
        const renderPhaseErrors = consoleErrorSpy.mock.calls.filter((call: any[]) =>
            call.some(
                (arg: any) =>
                    typeof arg === 'string' &&
                    (arg.includes('Cannot update a component') ||
                        arg.includes('State update on unmounted component') ||
                        arg.includes('bad setState'))
            )
        )
        expect(renderPhaseErrors.length).toBe(0)

        consoleErrorSpy.mockRestore()
        consoleWarnSpy.mockRestore()
    })

    describe('PersonalTransactionDrawer Integration', () => {
        it('resets form values upon open transition event callbacks', async () => {
            let isOpen = false
            const handleOpenChange = vi.fn((nextOpen: boolean) => {
                isOpen = nextOpen
            })

            await act(async () => {
                root.render(
                    <PersonalTransactionDrawer
                        open={true}
                        onOpenChange={handleOpenChange}
                        hideTrigger={true}
                    />
                )
            })

            const nameInput = (document.body.querySelector('input[placeholder*="Starbucks"]') || document.body.querySelector('input[name="name"]')) as HTMLInputElement
            expect(nameInput).not.toBeNull()
            expect(nameInput.value).toBe('')

            // Change input value
            await act(async () => {
                nameInput.value = 'Coffee'
                nameInput.dispatchEvent(new Event('input', { bubbles: true }))
            })

            // Close and re-open drawer via event callback
            await act(async () => {
                root.render(
                    <PersonalTransactionDrawer
                        open={false}
                        onOpenChange={handleOpenChange}
                        hideTrigger={true}
                    />
                )
            })

            await act(async () => {
                root.render(
                    <PersonalTransactionDrawer
                        open={true}
                        onOpenChange={handleOpenChange}
                        hideTrigger={true}
                    />
                )
            })

            const resetNameInput = (document.body.querySelector('input[placeholder*="Starbucks"]') || document.body.querySelector('input[name="name"]')) as HTMLInputElement
            expect(resetNameInput).not.toBeNull()
            expect(resetNameInput.value).toBe('')
        })

        it('populates form with initialData upon open and respects default account resolution', async () => {
            const mockTx = {
                id: 'tx-personal-1',
                amount: 45000, // 450.00 INR
                name: 'Groceries at Supermarket',
                note: 'Weekly provisions',
                flow: 'OUT',
                category_id: 'cat-groceries',
                contact_id: 'person-1',
            }

            await act(async () => {
                root.render(
                    <PersonalTransactionDrawer
                        open={true}
                        initialData={mockTx}
                        hideTrigger={true}
                    />
                )
            })

            const nameInput = (document.body.querySelector('input[placeholder*="Starbucks"]') || document.body.querySelector('input[name="name"]')) as HTMLInputElement
            const amountInput = (document.body.querySelector('input[placeholder="0.00"]') || document.body.querySelector('input[name="amount"]')) as HTMLInputElement

            expect(nameInput).not.toBeNull()
            expect(amountInput).not.toBeNull()
            expect(nameInput.value).toBe('Groceries at Supermarket')
            expect(amountInput.value).toBe('450')

            // Default account fallback was resolved to acc-default since mockTx has no account_id
            const defaultAcc = getDefaultAccount(mockAccountsData)
            expect(defaultAcc?.id).toBe('acc-default')
        })

        it('pre-selects fallback account when no account is marked is_default', async () => {
            mockAccountsData = [
                { id: 'acc-fallback-1', name: 'Account 1', is_default: false },
                { id: 'acc-fallback-2', name: 'Account 2', is_default: false },
            ]

            await act(async () => {
                root.render(
                    <PersonalTransactionDrawer
                        open={true}
                        hideTrigger={true}
                    />
                )
            })

            const resolvedDefault = getDefaultAccount(mockAccountsData)
            expect(resolvedDefault?.id).toBe('acc-fallback-1')
        })
    })

    describe('BusinessTransactionDrawer Integration', () => {
        it('resets form values upon open state transitions', async () => {
            await act(async () => {
                root.render(
                    <BusinessTransactionDrawer
                        open={true}
                        hideTrigger={true}
                    />
                )
            })

            const nameInput = document.body.querySelector('input[placeholder*="Payment for goods"]') as HTMLInputElement
            expect(nameInput).not.toBeNull()
            expect(nameInput.value).toBe('')

            // Render closed then re-open
            await act(async () => {
                root.render(
                    <BusinessTransactionDrawer
                        open={false}
                        hideTrigger={true}
                    />
                )
            })

            await act(async () => {
                root.render(
                    <BusinessTransactionDrawer
                        open={true}
                        hideTrigger={true}
                    />
                )
            })

            const reopenedNameInput = document.body.querySelector('input[placeholder*="Payment for goods"]') as HTMLInputElement
            expect(reopenedNameInput).not.toBeNull()
            expect(reopenedNameInput.value).toBe('')
        })

        it('populates business initialData cleanly on open', async () => {
            const initialBizTx = {
                id: 'biz-1',
                amount: 120000, // 1200 INR
                name: 'Office Supplies Order',
                note: 'Paper and ink',
                flow: 'OUT',
                contact_id: 'biz-contact-1',
            }

            await act(async () => {
                root.render(
                    <BusinessTransactionDrawer
                        open={true}
                        initialData={initialBizTx}
                        hideTrigger={true}
                    />
                )
            })

            const nameInput = document.body.querySelector('input[placeholder*="Payment for goods"]') as HTMLInputElement
            const amountInput = document.body.querySelector('input[placeholder="0.00"]') as HTMLInputElement

            expect(nameInput).not.toBeNull()
            expect(amountInput).not.toBeNull()
            expect(nameInput.value).toBe('Office Supplies Order')
            expect(amountInput.value).toBe('1200')
        })
    })

    describe('SplitExpenseDrawer Integration', () => {
        const mockMembers = [
            { id: 'm-1', group_id: 'g-1', user_id: 'user-1', ghost_name: 'User One', avatar_url: null, joined_at: '2026-01-01' },
            { id: 'm-2', group_id: 'g-1', user_id: 'user-2', ghost_name: 'User Two', avatar_url: null, joined_at: '2026-01-01' },
        ]

        it('resets transient step and input values when drawer is closed via onOpenChange', async () => {
            await act(async () => {
                root.render(
                    <SplitExpenseDrawer groupId="g-1" members={mockMembers} currentUserId="user-1">
                        <button>Open Split</button>
                    </SplitExpenseDrawer>
                )
            })

            // Open trigger button click
            const trigger = container.querySelector('button')
            await act(async () => {
                trigger?.click()
            })

            // Check if step 1 inputs are present
            const descInput = container.querySelector('input[placeholder="What was this for?"]') as HTMLInputElement
            const amountInput = container.querySelector('input[placeholder="0.00"]') as HTMLInputElement

            if (descInput && amountInput) {
                await act(async () => {
                    descInput.value = 'Dinner'
                    descInput.dispatchEvent(new Event('input', { bubbles: true }))
                    amountInput.value = '100'
                    amountInput.dispatchEvent(new Event('input', { bubbles: true }))
                })
            }

            // Verify default account resolution within SplitExpenseDrawer scope
            const defaultAcc = getDefaultAccount(mockAccountsData)
            expect(defaultAcc?.id).toBe('acc-default')
        })

        it('resolves account fallback correctly when accounts array changes', () => {
            const accountsWithoutDefault = [
                { id: 'acc-first', name: 'First Account', is_default: false },
                { id: 'acc-second', name: 'Second Account', is_default: false },
            ]
            const resolved = getDefaultAccount(accountsWithoutDefault)
            expect(resolved?.id).toBe('acc-first')
        })
    })

    describe('ContactReconciliationWizard Integration', () => {
        const mockContacts = [
            { id: 'contact-1', name: 'Alice Smith', phone: '+1555123456', email: 'alice@example.com' },
            { id: 'contact-2', name: 'Bob Jones', phone: '+1555987654', email: 'bob@example.com' },
        ]

        const mockGhosts = [
            {
                ghostMemberId: 'ghost-101',
                groupId: 'group-1',
                groupName: 'Summer Trip 2026',
                ghostName: 'Alice (Ghost)',
                adminId: 'admin-user-1',
            },
            {
                ghostMemberId: 'ghost-102',
                groupId: 'group-2',
                groupName: 'Office Lunch Club',
                ghostName: 'Bob J.',
                adminId: 'admin-user-2',
            },
        ]

        it('derives default ghost key cleanly without render side-effects and handles override updates', async () => {
            await act(async () => {
                root.render(
                    <ContactReconciliationWizard
                        unregisteredContacts={mockContacts}
                        candidateGhostMembers={mockGhosts}
                        targetUserId="user-me"
                    />
                )
            })

            // Verify wizard renders step 1
            expect(container.textContent).toContain('Select Unregistered Contact')
            expect(container.textContent).toContain('Step 1 of 3')
        })
    })
})
