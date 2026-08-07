import { describe, it, expect, vi } from 'vitest'
import { getPersonalTransactionFormDefaults } from '../personal/PersonalTransactionDrawer'
import { getBusinessTransactionFormDefaults } from '../business/BusinessTransactionDrawer'
import { getDefaultAccount } from '@/lib/account-utils'

describe('Shared Account & Form State Helpers', () => {
    describe('getDefaultAccount', () => {
        it('resolves default account accurately', () => {
            const accounts = [
                { id: 'acc-1', name: 'Savings', is_default: false },
                { id: 'acc-2', name: 'Primary Cash', is_default: true },
            ]
            expect(getDefaultAccount(accounts)?.id).toBe('acc-2')
        })

        it('falls back to the first available account when no account is default', () => {
            const accounts = [
                { id: 'acc-1', name: 'Savings', is_default: false },
                { id: 'acc-2', name: 'Checking', is_default: false },
            ]
            expect(getDefaultAccount(accounts)?.id).toBe('acc-1')
        })
    })

    describe('getBusinessTransactionFormDefaults', () => {
        it('returns empty default values when initialData is empty or undefined', () => {
            const defaults = getBusinessTransactionFormDefaults()
            expect(defaults.amount).toBe('')
            expect(defaults.name).toBe('')
            expect(defaults.note).toBe('')
            expect(defaults.flow).toBe('OUT')
            expect(defaults.contact_id).toBe('')
            expect(defaults.due_date).toBeUndefined()
            expect(defaults.category_id).toBeNull()
            expect(defaults.account_id).toBeNull()
        })

        it('populates initial form values correctly from existing business transaction data', () => {
            const initialData = {
                id: 'biz-tx-1',
                amount: 50000, // 500.00 in paise
                name: 'Vendor Invoice #42',
                note: 'Raw materials',
                date: '2026-08-01T10:00:00.000Z',
                due_date: '2026-08-15T10:00:00.000Z',
                flow: 'IN',
                contact_id: 'contact-supplier',
            }
            const defaults = getBusinessTransactionFormDefaults(initialData)

            expect(defaults.amount).toBe(500)
            expect(defaults.name).toBe('Vendor Invoice #42')
            expect(defaults.note).toBe('Raw materials')
            expect(defaults.flow).toBe('IN')
            expect(defaults.contact_id).toBe('contact-supplier')
            expect(defaults.due_date).toEqual(new Date('2026-08-15T10:00:00.000Z'))
        })
    })

    describe('getPersonalTransactionFormDefaults', () => {
        it('returns empty default values when initialData is empty or undefined', () => {
            const defaults = getPersonalTransactionFormDefaults()
            expect(defaults.amount).toBeUndefined()
            expect(defaults.name).toBe('')
            expect(defaults.note).toBe('')
            expect(defaults.flow).toBe('OUT')
            expect(defaults.contact_id).toBeNull()
            expect(defaults.category_id).toBeNull()
            expect(defaults.account_id).toBeUndefined()
        })

        it('populates initial form values correctly from existing personal transaction data', () => {
            const initialData = {
                id: 'tx-100',
                amount: 15000, // 150.00 in paise
                name: 'Groceries',
                note: 'Weekly fruits',
                flow: 'OUT',
                contact_id: 'friend-1',
                category_id: 'cat-groceries',
                account_id: 'acc-wallet',
            }
            const defaults = getPersonalTransactionFormDefaults(initialData)

            expect(defaults.amount).toBe(150)
            expect(defaults.name).toBe('Groceries')
            expect(defaults.note).toBe('Weekly fruits')
            expect(defaults.flow).toBe('OUT')
            expect(defaults.contact_id).toBe('friend-1')
            expect(defaults.category_id).toBe('cat-groceries')
            expect(defaults.account_id).toBe('acc-wallet')
        })
    })
})
