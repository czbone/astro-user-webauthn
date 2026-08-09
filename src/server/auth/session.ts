import type { Context } from 'hono'
import type { AstroCookies } from 'astro'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  SESSION_MAX_AGE_SECONDS,
  authEnv
} from '@/server/auth/env'
import {
  clearSessionCookieOnContext,
  getSessionTokenFromRequest,
  setSessionCookieOnContext
} from '@/server/auth/cookie'
import { generateToken, hashToken } from '@/server/auth/tokens'
import SessionDB from '@/server/db/session'
import UserDB from '@/server/db/user'
import type { AuthUser } from '@/types/models'

export type ResolvedSession = {
  sessionId: string
  user: AuthUser
  token: string
}

export function setSessionCookie(
  cookies: AstroCookies,
  token: string
) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: authEnv.isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  })
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: authEnv.isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

export async function createSession(userId: string): Promise<{ token: string; sessionId: string }> {
  const token = generateToken()
  const session = await SessionDB.create(userId, hashToken(token))
  return { token, sessionId: session.id }
}

export async function resolveSessionFromToken(token: string | undefined | null): Promise<ResolvedSession | null> {
  if (!token) return null

  const session = await SessionDB.findValidByTokenHash(hashToken(token), SESSION_MAX_AGE_MS)
  if (!session) return null

  const credentialCount = await UserDB.countCredentials(session.userId)
  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as 'admin' | 'user',
    hasPasskey: credentialCount > 0,
    mustSetupPasskey: credentialCount === 0
  }

  await SessionDB.touch(session.id)

  return {
    sessionId: session.id,
    user,
    token
  }
}

export async function resolveSessionFromCookies(cookies: AstroCookies): Promise<ResolvedSession | null> {
  const token = cookies.get(SESSION_COOKIE)?.value
  const resolved = await resolveSessionFromToken(token)
  if (resolved) {
    setSessionCookie(cookies, resolved.token)
  }
  return resolved
}

export async function resolveSessionFromHono(c: Context): Promise<ResolvedSession | null> {
  const token = getSessionTokenFromRequest(c)
  const resolved = await resolveSessionFromToken(token)
  if (resolved) {
    setSessionCookieOnContext(c, resolved.token)
  }
  return resolved
}

export { clearSessionCookieOnContext, setSessionCookieOnContext }
