import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/server/auth/password'

async function main() {
  console.log('初期データの挿入を開始します...')

  await prisma.webAuthnCredential.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin-change-me'
  const passwordHash = await hashPassword(password)

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Administrator',
      role: 'admin',
      password: passwordHash
    }
  })

  console.log('管理者を作成しました:', {
    id: admin.id,
    email: admin.email,
    role: admin.role
  })
  console.log('初期パスワードは SEED_ADMIN_PASSWORD を参照してください')
  console.log('初期データの挿入が完了しました')
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
