import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export type EnvIssue = {
  level: 'error' | 'warn'
  name: string
  message: string
}

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'REDIS_URL',
  'APP_URL',
  'WEBAUTHN_RP_ID',
  'WEBAUTHN_ORIGIN'
] as const

const DEVELOPMENT_DEFAULTS: Record<string, string[]> = {
  REDIS_URL: ['redis://localhost:6379', 'redis://localhost:6379/'],
  APP_URL: ['http://localhost:3000', 'http://localhost:3000/'],
  WEBAUTHN_ORIGIN: ['http://localhost:3000', 'http://localhost:3000/'],
  WEBAUTHN_RP_ID: ['localhost']
}

const DEFAULT_SEED_PASSWORD = 'admin-change-me'

function isDevelopmentDefault(name: string, value: string): boolean {
  const defaults = DEVELOPMENT_DEFAULTS[name]
  if (!defaults) return false
  return defaults.includes(value) || defaults.includes(value.replace(/\/$/, ''))
}

export function collectEnvIssues(
  env: Record<string, string | undefined>,
  production: boolean
): EnvIssue[] {
  const issues: EnvIssue[] = []

  if (!env.NODE_ENV) {
    issues.push({
      level: 'warn',
      name: 'NODE_ENV',
      message: 'NODE_ENV が未設定です。本番では production を設定してください'
    })
  }

  for (const name of REQUIRED_IN_PRODUCTION) {
    const value = env[name]?.trim()
    if (!value) {
      issues.push({
        level: production ? 'error' : 'warn',
        name,
        message: `${name} が設定されていません`
      })
      continue
    }

    if (production && isDevelopmentDefault(name, value)) {
      issues.push({
        level: 'error',
        name,
        message: `${name} が開発用の値（${value}）のままです`
      })
    }
  }

  if (env.MAIL_MODE === 'smtp') {
    if (!env.SMTP_HOST?.trim() || !env.SMTP_FROM?.trim()) {
      issues.push({
        level: production ? 'error' : 'warn',
        name: 'SMTP',
        message: 'MAIL_MODE=smtp のときは SMTP_HOST と SMTP_FROM が必要です'
      })
    }
  }

  if (env.RUN_SEED === 'true' && production) {
    const password = env.SEED_ADMIN_PASSWORD
    if (!password || password === DEFAULT_SEED_PASSWORD) {
      issues.push({
        level: 'error',
        name: 'SEED_ADMIN_PASSWORD',
        message: '本番では SEED_ADMIN_PASSWORD に既定値（admin-change-me）以外を設定してください'
      })
    }
  }

  return issues
}

function shouldSkipValidation(): boolean {
  return process.env.VITEST === 'true' || process.env.npm_lifecycle_event === 'build'
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return resolve(fileURLToPath(import.meta.url)) === resolve(entry)
}

export function validateRuntimeEnv(
  env: Record<string, string | undefined> = process.env
): EnvIssue[] {
  if (shouldSkipValidation()) {
    return []
  }

  const production = env.NODE_ENV === 'production'
  const issues = collectEnvIssues(env, production)

  for (const issue of issues) {
    const line = `[env] ${issue.message}`
    if (issue.level === 'error') {
      console.error(line)
    } else {
      console.warn(line)
    }
  }

  if (production && issues.some((issue) => issue.level === 'error')) {
    console.error('[env] 本番起動に必要な環境変数が不足しているため終了します')
    process.exit(1)
  }

  return issues
}

if (isDirectRun()) {
  validateRuntimeEnv()
}
