import 'dotenv/config'
import { vi } from 'vitest'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Integration tests require a dedicated database URL.'
  )
}

process.env.DATABASE_URL = testDatabaseUrl

vi.mock('@/server/auth/mail', () => ({
  sendPasswordResetMail: vi.fn(),
  sendUserInviteMail: vi.fn()
}))
