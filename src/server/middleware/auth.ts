import { createMiddleware } from 'hono/factory'
import { resolveSessionFromHono } from '@/server/auth/session'
import type { AppVariables } from '@/server/middleware/types'

export const loadSession = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const resolved = await resolveSessionFromHono(c)
  if (resolved) {
    c.set('user', resolved.user)
    c.set('sessionId', resolved.sessionId)
  }
  await next()
})

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'ログインが必要です' }, 401)
  }
  return next()
})

export const requirePasskey = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'ログインが必要です' }, 401)
  }
  if (user.mustSetupPasskey) {
    return c.json({ error: '先にパスキーを登録してください' }, 403)
  }
  return next()
})

export const requireAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'ログインが必要です' }, 401)
  }
  if (user.mustSetupPasskey) {
    return c.json({ error: '先にパスキーを登録してください' }, 403)
  }
  if (user.role !== 'admin') {
    return c.json({ error: '管理者権限が必要です' }, 403)
  }
  return next()
})
