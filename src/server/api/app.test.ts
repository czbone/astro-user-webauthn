import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {}
}))

vi.mock('@/server/db', () => ({
  UserDB: {
    findByEmail: vi.fn(),
    countCredentials: vi.fn(),
    count: vi.fn(),
    countAdmins: vi.fn(),
    list: vi.fn()
  },
  PostDB: {
    listForViewer: vi.fn(),
    count: vi.fn(),
    countPublished: vi.fn()
  },
  SessionDB: {
    findValidByTokenHash: vi.fn(),
    create: vi.fn(),
    touch: vi.fn(),
    deleteById: vi.fn()
  },
  CredentialDB: {},
  InviteDB: {},
  PasswordResetDB: {
    invalidatePendingForUser: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock('@/server/auth/mail', () => ({
  sendPasswordResetMail: vi.fn(),
  sendUserInviteMail: vi.fn()
}))

const { default: app } = await import('@/server/api/app')
const { UserDB, PasswordResetDB } = await import('@/server/db')
const { sendPasswordResetMail } = await import('@/server/auth/mail')

describe('API app smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /auth/me returns null user without a session', async () => {
    const res = await app.request('/auth/me')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ user: null })
  })

  it('POST /auth/login/password rejects empty credentials', async () => {
    const res = await app.request('/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: 'メールアドレスとパスワードは必須です'
    })
  })

  it('GET /posts requires authentication', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(401)
  })

  it('GET /admin/stats requires authentication', async () => {
    const res = await app.request('/admin/stats')
    expect(res.status).toBe(401)
  })

  it('POST /auth/password-reset/request always returns a generic success', async () => {
    vi.mocked(UserDB.findByEmail).mockResolvedValue(null)

    const res = await app.request('/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' })
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      message: '入力されたメールアドレスにアカウントがある場合、再設定手順を送信しました'
    })
    expect(PasswordResetDB.create).not.toHaveBeenCalled()
    expect(sendPasswordResetMail).not.toHaveBeenCalled()
  })
})
