import { Hono } from 'hono'
import { sendUserInviteMail } from '@/server/auth/mail'
import { generateTemporaryPassword, hashPassword } from '@/server/auth/password'
import { PostDB, UserDB } from '@/server/db'
import { loadSession, requireAdmin } from '@/server/middleware/auth'
import type { AppVariables } from '@/server/middleware/types'

const admin = new Hono<{ Variables: AppVariables }>()

admin.use('*', loadSession, requireAdmin)

admin.get('/stats', async (c) => {
  try {
    const [userCount, adminCount, postCount, publishedPostCount] = await Promise.all([
      UserDB.count(),
      UserDB.countAdmins(),
      PostDB.count(),
      PostDB.countPublished()
    ])

    return c.json(
      {
        userCount,
        adminCount,
        postCount,
        publishedPostCount
      },
      200
    )
  } catch (error) {
    console.error('統計取得エラー:', error)
    return c.json({ error: '統計の取得に失敗しました' }, 500)
  }
})

admin.get('/users', async (c) => {
  try {
    const users = await UserDB.list()
    return c.json(users, 200)
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error)
    return c.json({ error: 'ユーザー一覧の取得に失敗しました' }, 500)
  }
})

admin.post('/users', async (c) => {
  try {
    const body = await c.req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const role = body.role === 'admin' ? 'admin' : 'user'

    if (!email || !name) {
      return c.json({ error: 'メールアドレスと名前は必須です' }, 400)
    }

    const existing = await UserDB.findByEmail(email)
    if (existing) {
      return c.json({ error: 'このメールアドレスは既に登録されています' }, 409)
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(temporaryPassword)
    const user = await UserDB.create({
      email,
      name,
      role,
      password: passwordHash
    })

    await sendUserInviteMail({
      to: user.email,
      name: user.name,
      temporaryPassword
    })

    return c.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      201
    )
  } catch (error) {
    console.error('ユーザー招待エラー:', error)
    return c.json({ error: 'ユーザーの招待に失敗しました' }, 500)
  }
})

export default admin
