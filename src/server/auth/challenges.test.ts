import { describe, expect, it } from 'vitest'
import { saveChallenge, takeChallenge } from '@/server/auth/challenges'

describe('challenges', () => {
  it('saves and consumes a challenge for a user', () => {
    const userId = `user-${Date.now()}-${Math.random()}`
    saveChallenge('register', 'challenge-value', userId)

    const first = takeChallenge('register', userId)
    expect(first).toMatchObject({
      challenge: 'challenge-value',
      kind: 'register',
      userId
    })

    expect(takeChallenge('register', userId)).toBeNull()
  })

  it('returns null when no challenge exists', () => {
    expect(takeChallenge('register', `missing-${Date.now()}`)).toBeNull()
  })
})
