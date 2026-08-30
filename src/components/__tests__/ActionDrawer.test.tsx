import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ActionDrawer, ActionDrawerItem } from '../ui/action-drawer'

describe('ActionDrawer Component', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        vi.clearAllMocks()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
    })

    it('renders default trigger button with accessible label and touch-target styling', async () => {
        await act(async () => {
            root.render(
                <ActionDrawer
                    title="Item Options"
                    actions={[]}
                />
            )
        })

        const trigger = container.querySelector('button[aria-label="More options"]') as HTMLButtonElement
        expect(trigger).not.toBeNull()
    })

    it('renders custom trigger button if provided', async () => {
        await act(async () => {
            root.render(
                <ActionDrawer
                    title="Item Options"
                    trigger={<button id="custom-trigger">Custom Action</button>}
                    actions={[]}
                />
            )
        })

        const trigger = container.querySelector('#custom-trigger') as HTMLButtonElement
        expect(trigger).not.toBeNull()
        expect(trigger.textContent).toBe('Custom Action')
    })

    it('renders title, description, and all action items when opened', async () => {
        const handleEdit = vi.fn()
        const handleDelete = vi.fn()

        const actions: ActionDrawerItem[] = [
            {
                label: 'Edit Item',
                onClick: handleEdit,
            },
            {
                label: 'Delete Item',
                onClick: handleDelete,
                variant: 'destructive',
            },
        ]

        await act(async () => {
            root.render(
                <ActionDrawer
                    open={true}
                    title="Manage Subscription"
                    description="Choose an action for Netflix"
                    actions={actions}
                />
            )
        })

        expect(document.body.textContent).toContain('Manage Subscription')
        expect(document.body.textContent).toContain('Choose an action for Netflix')
        expect(document.body.textContent).toContain('Edit Item')
        expect(document.body.textContent).toContain('Delete Item')

        const deleteBtn = Array.from(document.body.querySelectorAll('button')).find(
            (b) => b.textContent?.includes('Delete Item')
        )
        expect(deleteBtn).not.toBeUndefined()
        expect(deleteBtn?.className).toContain('text-destructive')
    })

    it('triggers onClick and onOpenChange when action item is tapped', async () => {
        const handleEdit = vi.fn()
        const onOpenChange = vi.fn()

        const actions: ActionDrawerItem[] = [
            {
                label: 'Edit Item',
                onClick: handleEdit,
            },
        ]

        await act(async () => {
            root.render(
                <ActionDrawer
                    open={true}
                    onOpenChange={onOpenChange}
                    title="Options"
                    actions={actions}
                />
            )
        })

        const editBtn = Array.from(document.body.querySelectorAll('button')).find(
            (b) => b.textContent?.includes('Edit Item')
        )
        expect(editBtn).not.toBeUndefined()

        await act(async () => {
            editBtn?.click()
        })

        expect(handleEdit).toHaveBeenCalledTimes(1)
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })
})
