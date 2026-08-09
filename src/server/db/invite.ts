import { prisma } from '@/lib/prisma'

class InviteDB {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.deviceInvite.create({
      data: { userId, tokenHash, expiresAt }
    })
  }

  async findValidByTokenHash(tokenHash: string) {
    const invite = await prisma.deviceInvite.findUnique({
      where: { tokenHash },
      include: { user: true }
    })
    if (!invite || invite.usedAt) return null
    if (invite.expiresAt.getTime() <= Date.now()) return null
    return invite
  }

  async markUsed(id: string) {
    return prisma.deviceInvite.update({
      where: { id },
      data: { usedAt: new Date() }
    })
  }

  async invalidatePendingForUser(userId: string) {
    return prisma.deviceInvite.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() }
    })
  }
}

export default new InviteDB()
