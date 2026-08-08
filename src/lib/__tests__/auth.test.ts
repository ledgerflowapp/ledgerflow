import { describe, test, expect, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { authClient, signIn, signUp, signOut, getSession } from '@/lib/auth-client'
import { proxy } from '@/proxy'
import { NextRequest } from 'next/server'

function createMockSession(overrides: { expiresAt?: Date; token?: string } = {}) {
    return {
        user: {
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        session: {
            id: 'session_123',
            userId: 'user_123',
            expiresAt: overrides.expiresAt ?? new Date(Date.now() + 100000),
            createdAt: new Date(),
            updatedAt: new Date(),
            token: overrides.token ?? 'valid_token',
        },
    }
}

describe('Better Auth Integration', () => {
    test('auth server instance is initialized correctly', () => {
        expect(auth).toBeDefined()
        expect(auth.handler).toBeTypeOf('function')
        expect(auth.api).toBeDefined()
    })

    test('auth client instance and methods are exported correctly', () => {
        expect(authClient).toBeDefined()
        expect(signIn).toBeDefined()
        expect(signUp).toBeDefined()
        expect(signOut).toBeDefined()
        expect(getSession).toBeDefined()
    })

    describe('Proxy protection', () => {
        test('redirects unauthenticated user from /dashboard to /login', async () => {
            const req = new NextRequest('http://localhost:3000/dashboard')
            const res = await proxy(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/login')
        })

        test('allows unauthenticated access to /login', async () => {
            const req = new NextRequest('http://localhost:3000/login')
            const res = await proxy(req)
            expect(res.headers.get('location')).toBeNull()
        })

        test('redirects user with forged or expired session token from /dashboard to /login', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)
            const req = new NextRequest('http://localhost:3000/dashboard', {
                headers: {
                    cookie: 'better-auth.session_token=forged_token_123',
                },
            })
            const res = await proxy(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/login')
        })

        test('allows user with forged or expired session token to access /login', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)
            const req = new NextRequest('http://localhost:3000/login', {
                headers: {
                    cookie: 'better-auth.session_token=forged_token_123',
                },
            })
            const res = await proxy(req)
            expect(res.headers.get('location')).toBeNull()
        })

        test('redirects user with valid active session from /login to /dashboard', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(createMockSession() as any)
            const req = new NextRequest('http://localhost:3000/login', {
                headers: {
                    cookie: 'better-auth.session_token=valid_token',
                },
            })
            const res = await proxy(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        test('allows user with valid active session to access /dashboard', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(createMockSession() as any)
            const req = new NextRequest('http://localhost:3000/dashboard', {
                headers: {
                    cookie: 'better-auth.session_token=valid_token',
                },
            })
            const res = await proxy(req)
            expect(res.headers.get('location')).toBeNull()
        })

        test('redirects user with expired session timestamp from /dashboard to /login', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)
            const req = new NextRequest('http://localhost:3000/dashboard', {
                headers: {
                    cookie: 'better-auth.session_token=expired_token',
                },
            })
            const res = await proxy(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/login')
        })

        test('handles session validation error gracefully and redirects /dashboard to /login', async () => {
            vi.spyOn(auth.api, 'getSession').mockRejectedValueOnce(new Error('DB failure'))
            const req = new NextRequest('http://localhost:3000/dashboard', {
                headers: {
                    cookie: 'better-auth.session_token=any_token',
                },
            })
            const res = await proxy(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/login')
        })

        test('validates ledgerflow.session_token cookie prefix correctly', async () => {
            vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(createMockSession() as any)
            const req = new NextRequest('http://localhost:3000/dashboard/settings', {
                headers: {
                    cookie: 'ledgerflow.session_token=valid_token',
                },
            })
            const res = await proxy(req)
            expect(res.headers.get('location')).toBeNull()
        })
    })
})
