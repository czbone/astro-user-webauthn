import { randomUUID } from 'node:crypto'
import { redis } from '@/lib/redis'
import { SESSION_MAX_AGE_SECONDS } from '@/server/auth/env'
import { RedisKeys } from '@/server/redis/keys'

export type SessionRecord = {
  id: string
  userId: string
  createdAt: string
  tokenHash: string
}

class SessionDB {
  async create(userId: string, tokenHash: string): Promise<SessionRecord> {
    const record: SessionRecord = {
      id: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      tokenHash
    }
    const ttl = SESSION_MAX_AGE_SECONDS
    const sessionKey = RedisKeys.session(tokenHash)
    const userKey = RedisKeys.sessionUser(userId)

    const pipeline = redis.pipeline()
    pipeline.set(sessionKey, JSON.stringify({
      id: record.id,
      userId: record.userId,
      createdAt: record.createdAt
    }), 'EX', ttl)
    pipeline.sadd(userKey, tokenHash)
    pipeline.expire(userKey, ttl)
    await pipeline.exec()

    return record
  }

  async findValidByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const raw = await redis.get(RedisKeys.session(tokenHash))
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw) as Omit<SessionRecord, 'tokenHash'>
      if (!parsed.id || !parsed.userId) return null
      return { ...parsed, tokenHash }
    } catch {
      return null
    }
  }

  async touch(tokenHash: string, userId: string) {
    const ttl = SESSION_MAX_AGE_SECONDS
    const pipeline = redis.pipeline()
    pipeline.expire(RedisKeys.session(tokenHash), ttl)
    pipeline.expire(RedisKeys.sessionUser(userId), ttl)
    await pipeline.exec()
  }

  async revoke(tokenHash: string) {
    const session = await this.findValidByTokenHash(tokenHash)
    const pipeline = redis.pipeline()
    pipeline.del(RedisKeys.session(tokenHash))
    if (session) {
      pipeline.srem(RedisKeys.sessionUser(session.userId), tokenHash)
    }
    await pipeline.exec()
  }

  async revokeAllForUser(userId: string) {
    const userKey = RedisKeys.sessionUser(userId)
    const tokenHashes = await redis.smembers(userKey)
    if (tokenHashes.length === 0) {
      await redis.del(userKey)
      return
    }

    const pipeline = redis.pipeline()
    for (const tokenHash of tokenHashes) {
      pipeline.del(RedisKeys.session(tokenHash))
    }
    pipeline.del(userKey)
    await pipeline.exec()
  }

  async countForUser(userId: string): Promise<number> {
    return redis.scard(RedisKeys.sessionUser(userId))
  }
}

export default new SessionDB()
