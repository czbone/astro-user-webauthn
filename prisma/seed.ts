import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/server/auth/password'

const DEFAULT_ADMIN_EMAIL = 'admin@example.com'
const DEFAULT_ADMIN_PASSWORD = 'admin-change-me'

async function main() {
  console.log('初期データの挿入を開始します...')

  const existing = await prisma.user.count()
  if (existing > 0) {
    console.log(`User が既に ${existing} 件あるため seed をスキップします`)
    return
  }

  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && (!password || password === DEFAULT_ADMIN_PASSWORD)) {
    throw new Error(
      '本番では SEED_ADMIN_PASSWORD に既定値（admin-change-me）以外を設定してください'
    )
  }

  const resolvedPassword = password || DEFAULT_ADMIN_PASSWORD
  const passwordHash = await hashPassword(resolvedPassword)

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
