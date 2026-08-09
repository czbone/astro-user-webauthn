import { prisma } from '@/lib/prisma'

class PasswordResetDB {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordReset.create({
      data: { userId, tokenHash, expiresAt }
    })
  }

  async findValidByTokenHash(tokenHash: string) {
    const reset = await prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { user: true }
    })
    if (!reset || reset.usedAt) return null
    if (reset.expiresAt.getTime() <= Date.now()) return null
    return reset
  }

  async markUsed(id: string) {
    return prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() }
    })
  }

  async invalidatePendingForUser(userId: string) {
    return prisma.passwordReset.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() }
    })
  }
}

export default new PasswordResetDB()
