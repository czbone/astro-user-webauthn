import { describe, expect, it } from 'vitest'
import { checkRateLimit } from '@/server/auth/rate-limit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `allow-${Date.now()}-${Math.random()}`
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true })
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true })
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true })
  })

  it('blocks requests over the limit', () => {
    const key = `block-${Date.now()}-${Math.random()}`
    checkRateLimit(key, 2, 60_000)
    checkRateLimit(key, 2, 60_000)
    const limited = checkRateLimit(key, 2, 60_000)
    expect(limited.ok).toBe(false)
    if (!limited.ok) {
      expect(limited.retryAfterSec).toBeGreaterThanOrEqual(1)
    }
  })
})
