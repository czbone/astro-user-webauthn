type ChallengeEntry = {
  challenge: string
  userId?: string
  expiresAt: number
  kind: string
}

const store = new Map<string, ChallengeEntry>()
const TTL_MS = 5 * 60 * 1000

function cleanup() {
  const now = Date.now()
  for (const [key, value] of store) {
    if (value.expiresAt <= now) {
      store.delete(key)
    }
  }
}

export function saveChallenge(kind: string, challenge: string, userId?: string) {
  cleanup()
  const key = userId ? `${kind}:${userId}` : `${kind}:${challenge}`
  const entry: ChallengeEntry = {
    challenge,
    kind,
    expiresAt: Date.now() + TTL_MS
  }
  if (userId) {
    entry.userId = userId
  }
  store.set(key, entry)

  if (kind === 'auth') {
    const byChallenge: ChallengeEntry = {
      challenge,
      kind,
      expiresAt: entry.expiresAt
    }
    if (userId) {
      byChallenge.userId = userId
    }
    store.set(`auth-challenge:${challenge}`, byChallenge)
  }
}

export function takeChallenge(kind: string, userId: string): ChallengeEntry | null {
  cleanup()
  const key = `${kind}:${userId}`
  const entry = store.get(key)
  if (!entry) return null
  store.delete(key)
  if (entry.expiresAt <= Date.now()) return null
  return entry
}

export function takeAuthChallengeByValue(challenge: string): ChallengeEntry | null {
  cleanup()
  const key = `auth-challenge:${challenge}`
  const entry = store.get(key)
  if (!entry) return null
  store.delete(key)
  if (entry.userId) {
    store.delete(`auth:${entry.userId}`)
  }
  if (entry.expiresAt <= Date.now()) return null
  return entry
}

export function takeAuthChallengeForUser(userId: string): ChallengeEntry | null {
  cleanup()
  const key = `auth:${userId}`
  const entry = store.get(key)
  if (!entry) return null
  store.delete(key)
  store.delete(`auth-challenge:${entry.challenge}`)
  if (entry.expiresAt <= Date.now()) return null
  return entry
}
