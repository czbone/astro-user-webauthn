import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '@/server/api/app'
import { sendPasswordResetMail } from '@/server/auth/mail'
import { hashToken } from '@/server/auth/tokens'
import SessionDB from '@/server/db/session'
import PasswordResetDB from '@/server/db/password-reset'
import {
  createTestUser,
  resetDatabase,
  sessionCookieFromResponse
} from '@/test/db'

describe('auth integration', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()
  })

  it('logs in with password and creates a session', async () => {
    const { email, password, user } = await createTestUser()

    const res = await app.request('/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    expect(res.status).toBe(200)
    const token = sessionCookieFromResponse(res)
    expect(token).toBeTruthy()

    const session = await SessionDB.findValidByTokenHash(hashToken(token!))
    expect(session).toMatchObject({ userId: user.id })
    expect(await SessionDB.countForUser(user.id)).toBe(1)

    const body = await res.json()
    expect(body.user).toMatchObject({
      id: user.id,
      email: user.email,
      mustSetupPasskey: true
    })
  })

  it('returns the current user for GET /auth/me with a session cookie', async () => {
    const { email, password, user } = await createTestUser()

    const loginRes = await app.request('/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const token = sessionCookieFromResponse(loginRes)
    expect(token).toBeTruthy()

    const meRes = await app.request('/auth/me', {
      headers: { Cookie: `session=${encodeURIComponent(token!)}` }
    })

    expect(meRes.status).toBe(200)
    await expect(meRes.json()).resolves.toMatchObject({
      user: {
        id: user.id,
        email: user.email
      }
    })
  })

  it('revokes the session on logout', async () => {
    const { email, password, user } = await createTestUser()

    const loginRes = await app.request('/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const token = sessionCookieFromResponse(loginRes)
    expect(token).toBeTruthy()

    const logoutRes = await app.request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: `session=${encodeURIComponent(token!)}` }
    })
    expect(logoutRes.status).toBe(200)

    expect(await SessionDB.findValidByTokenHash(hashToken(token!))).toBeNull()
    expect(await SessionDB.countForUser(user.id)).toBe(0)

    const meRes = await app.request('/auth/me', {
      headers: { Cookie: `session=${encodeURIComponent(token!)}` }
    })
    expect(meRes.status).toBe(200)
    await expect(meRes.json()).resolves.toEqual({ user: null })
  })

  it('creates a password reset record when the user exists', async () => {
    const { email, user } = await createTestUser()

    const res = await app.request('/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    expect(res.status).toBe(200)
    expect(await PasswordResetDB.countForUser(user.id)).toBe(1)
    expect(sendPasswordResetMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        name: user.name
      })
    )
  })

  it('rejects wrong passwords without creating a session', async () => {
    const { email, user } = await createTestUser()

    const res = await app.request('/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' })
    })

    expect(res.status).toBe(401)
    expect(await SessionDB.countForUser(user.id)).toBe(0)
  })
})
