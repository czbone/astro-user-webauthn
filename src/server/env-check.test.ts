import { describe, expect, it } from 'vitest'
import { collectEnvIssues } from '@/server/env-check'

const productionBase = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@db:5432/app',
  REDIS_URL: 'redis://redis:6379/',
  APP_URL: 'https://app.example.com',
  WEBAUTHN_RP_ID: 'app.example.com',
  WEBAUTHN_ORIGIN: 'https://app.example.com'
}

describe('collectEnvIssues', () => {
  it('reports no errors when production variables are set', () => {
    expect(collectEnvIssues(productionBase, true)).toEqual([])
  })

  it('errors on missing required variables in production', () => {
    const issues = collectEnvIssues({ NODE_ENV: 'production' }, true)
    const names = issues.filter((issue) => issue.level === 'error').map((issue) => issue.name)
    expect(names).toEqual([
      'DATABASE_URL',
      'REDIS_URL',
      'APP_URL',
      'WEBAUTHN_RP_ID',
      'WEBAUTHN_ORIGIN'
    ])
  })

  it('warns on missing variables outside production', () => {
    const issues = collectEnvIssues({}, false)
    expect(issues.some((issue) => issue.name === 'NODE_ENV' && issue.level === 'warn')).toBe(true)
    expect(issues.filter((issue) => issue.level === 'error')).toEqual([])
    expect(issues.some((issue) => issue.name === 'WEBAUTHN_RP_ID' && issue.level === 'warn')).toBe(
      true
    )
  })

  it('errors on localhost defaults in production', () => {
    const issues = collectEnvIssues(
      {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@db:5432/app',
        REDIS_URL: 'redis://localhost:6379/',
        APP_URL: 'http://localhost:3000',
        WEBAUTHN_RP_ID: 'localhost',
        WEBAUTHN_ORIGIN: 'http://localhost:3000'
      },
      true
    )
    const names = issues.filter((issue) => issue.level === 'error').map((issue) => issue.name)
    expect(names).toEqual(['REDIS_URL', 'APP_URL', 'WEBAUTHN_RP_ID', 'WEBAUTHN_ORIGIN'])
  })

  it('errors when smtp is selected without host or from', () => {
    const issues = collectEnvIssues({ ...productionBase, MAIL_MODE: 'smtp' }, true)
    expect(issues.some((issue) => issue.name === 'SMTP' && issue.level === 'error')).toBe(true)
  })

  it('errors on an invalid DB_LOG_LEVEL in production', () => {
    const issues = collectEnvIssues({ ...productionBase, DB_LOG_LEVEL: 'debug' }, true)
    expect(issues.some((issue) => issue.name === 'DB_LOG_LEVEL' && issue.level === 'error')).toBe(
      true
    )
  })

  it('accepts a valid DB_LOG_LEVEL in production', () => {
    expect(collectEnvIssues({ ...productionBase, DB_LOG_LEVEL: 'query' }, true)).toEqual([])
  })

  it('errors when production seed uses the default password', () => {
    const issues = collectEnvIssues(
      { ...productionBase, RUN_SEED: 'true', SEED_ADMIN_PASSWORD: 'admin-change-me' },
      true
    )
    expect(
      issues.some((issue) => issue.name === 'SEED_ADMIN_PASSWORD' && issue.level === 'error')
    ).toBe(true)
  })
})
