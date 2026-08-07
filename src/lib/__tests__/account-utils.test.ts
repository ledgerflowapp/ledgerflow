import { describe, it, expect } from 'vitest'
import { getDefaultAccount } from '../account-utils'

describe('getDefaultAccount', () => {
    it('returns undefined when accounts array is undefined, null, or empty', () => {
        expect(getDefaultAccount(undefined)).toBeUndefined()
        expect(getDefaultAccount(null)).toBeUndefined()
        expect(getDefaultAccount([])).toBeUndefined()
    })

    it('returns the account flagged with is_default: true', () => {
        const accounts = [
            { id: '1', name: 'Savings', is_default: false },
            { id: '2', name: 'Main Cash', is_default: true },
            { id: '3', name: 'Wallet', is_default: false },
        ]
        expect(getDefaultAccount(accounts)).toEqual({ id: '2', name: 'Main Cash', is_default: true })
    })

    it('falls back to the first account if no account is flagged as default', () => {
        const accounts = [
            { id: '1', name: 'Savings', is_default: false },
            { id: '2', name: 'Main Cash', is_default: false },
        ]
        expect(getDefaultAccount(accounts)).toEqual({ id: '1', name: 'Savings', is_default: false })
    })

    it('handles accounts with missing or undefined is_default properties', () => {
        const accounts = [
            { id: '1', name: 'Bank' },
            { id: '2', name: 'Cash', is_default: true },
        ]
        expect(getDefaultAccount(accounts)).toEqual({ id: '2', name: 'Cash', is_default: true })
    })
})
