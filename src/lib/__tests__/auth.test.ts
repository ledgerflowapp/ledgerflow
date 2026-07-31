import { describe, test, expect, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { authClient, signIn, signUp, signOut, getSession } from '@/lib/auth-client'
import { middleware } from '@/middleware'
import { NextRequest } from 'next/server'

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

    describe('Middleware protection', () => {
        test('redirects unauthenticated user from /dashboard to /login', async () => {
            const req = new NextRequest('http://localhost:3000/dashboard')
            const res = await middleware(req)
            expect(res.status).toBe(307) // Redirect
            expect(res.headers.get('location')).toContain('/login')
        })

        test('redirects authenticated user from /login to /dashboard', async () => {
            const req = new NextRequest('http://localhost:3000/login', {
                headers: {
                    cookie: 'better-auth.session_token=fake_session_token_123',
                },
            })
            const res = await middleware(req)
            expect(res.status).toBe(307)
            expect(res.headers.get('location')).toContain('/dashboard')
        })

        test('allows unauthenticated access to /login', async () => {
            const req = new NextRequest('http://localhost:3000/login')
            const res = await middleware(req)
            expect(res.headers.get('location')).toBeNull()
        })
    })
})
