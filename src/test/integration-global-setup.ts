import { execSync } from 'node:child_process'
import 'dotenv/config'

export default function setup() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL
  if (!testDatabaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Start Postgres (e.g. docker compose -f docker-compose.db.yaml up -d) and set TEST_DATABASE_URL in .env.'
    )
  }

  process.env.DATABASE_URL = testDatabaseUrl

  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl
    }
  })
}
