import { redisKey } from '@/server/auth/redis-env'

export const RedisKeys = {
  session: (tokenHash: string) => redisKey(`sess:${tokenHash}`),
  sessionUser: (userId: string) => redisKey(`sess:user:${userId}`),
  challenge: (kind: string, id: string) => redisKey(`chal:${kind}:${id}`),
  authChallenge: (challenge: string) => redisKey(`chal:auth-challenge:${challenge}`),
  rateLimit: (logicalKey: string) => redisKey(`rl:${logicalKey}`),
  invite: (tokenHash: string) => redisKey(`invite:${tokenHash}`),
  inviteUser: (userId: string) => redisKey(`invite:user:${userId}`),
  reset: (tokenHash: string) => redisKey(`reset:${tokenHash}`),
  resetUser: (userId: string) => redisKey(`reset:user:${userId}`),
  magic: (tokenHash: string) => redisKey(`magic:${tokenHash}`),
  magicUser: (userId: string) => redisKey(`magic:user:${userId}`)
}
