/**
 * Resolves the default account from a list of accounts.
 * Returns the account with `is_default === true` if present,
 * otherwise falls back to the first account in the array, or `undefined` if empty/null.
 */
export function getDefaultAccount<T extends { is_default?: boolean | null }>(
    accounts?: T[] | null
): T | undefined {
    if (!accounts || accounts.length === 0) return undefined
    return accounts.find(a => Boolean(a.is_default)) || accounts[0]
}
