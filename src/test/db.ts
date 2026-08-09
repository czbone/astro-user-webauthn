import { randomBytes } from 'node:crypto'
import { hashPassword } from '@/server/auth/password'
import { prisma } from '@/lib/prisma'
import UserDB from '@/server/db/user'

export async function resetDatabase() {
  await prisma.user.deleteMany()
}

export async function createTestUser(input?: {
  email?: string
  password?: string
  name?: string
  role?: 'admin' | 'user'
}) {
  const password = input?.password ?? 'test-password-123'
  const email = input?.email ?? `user-${randomBytes(6).toString('hex')}@example.com`
  const user = await UserDB.create({
    email,
    password: await hashPassword(password),
    name: input?.name ?? 'Test User',
    role: input?.role ?? 'user'
  })
  return { user, password, email }
}

/** Fixture only — does not exercise WebAuthn registration. */
export async function insertPasskeyFixture(userId: string) {
  return prisma.webAuthnCredential.create({
    data: {
      userId,
      credentialId: `fixture-${randomBytes(16).toString('base64url')}`,
      publicKey: Buffer.from('integration-test-public-key'),
      counter: 0n
    }
  })
}

export function sessionCookieFromResponse(res: Response): string | null {
  const headers = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const candidates =
    headers.length > 0
      ? headers
      : [res.headers.get('set-cookie')].filter((value): value is string => Boolean(value))

  for (const header of candidates) {
    const match = /(?:^|,\s*)session=([^;]+)/i.exec(header)
    if (match?.[1]) {
      return decodeURIComponent(match[1])
    }
  }
  return null
}
