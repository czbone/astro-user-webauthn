import { prisma } from '@/lib/prisma'

class SessionDB {
  async create(userId: string, tokenHash: string) {
    return prisma.session.create({
      data: { userId, tokenHash }
    })
  }

  async findValidByTokenHash(tokenHash: string, maxAgeMs: number) {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true }
    })

    if (!session || session.revokedAt) return null

    const age = Date.now() - session.lastUsedAt.getTime()
    if (age > maxAgeMs) return null

    return session
  }

  async touch(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() }
    })
  }

  async revoke(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    })
  }

  async revokeAllForUser(userId: string) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  }
}

export default new SessionDB()
