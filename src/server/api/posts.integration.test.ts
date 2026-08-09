import { beforeEach, describe, expect, it } from 'vitest'
import app from '@/server/api/app'
import { createSession } from '@/server/auth/session'
import {
  createTestUser,
  insertPasskeyFixture,
  resetDatabase
} from '@/test/db'

describe('posts integration', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('returns 403 when the user has not registered a passkey', async () => {
    const { user } = await createTestUser()
    const { token } = await createSession(user.id)

    const res = await app.request('/posts', {
      headers: { Cookie: `session=${encodeURIComponent(token)}` }
    })

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({
      error: '先にパスキーを登録してください'
    })
  })

  it('lists posts when a passkey fixture exists for the user', async () => {
    const { user } = await createTestUser()
    await insertPasskeyFixture(user.id)
    const { token } = await createSession(user.id)

    const res = await app.request('/posts', {
      headers: { Cookie: `session=${encodeURIComponent(token)}` }
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
