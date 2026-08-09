import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import AuthFetch from '@/api-client/auth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'email' | 'password' | 'passkey'>('email')
  const [passkeyOptions, setPasskeyOptions] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await AuthFetch.loginMethod(email)
      if (!result || !result.response.ok) {
        alert(result?.data?.error || 'ログインに失敗しました')
        return
      }

      if (result.data?.method === 'passkey' && result.data.options) {
        setPasskeyOptions(result.data.options)
        setStep('passkey')
        return
      }

      setStep('password')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await AuthFetch.loginPassword(email, password)
      if (!result || !result.response.ok) {
        alert(result?.data?.error || 'ログインに失敗しました')
        return
      }
      window.location.href = '/setup-passkey'
    } finally {
      setLoading(false)
    }
  }

  async function handlePasskeyLogin() {
    if (!passkeyOptions) return
    setLoading(true)
    try {
      const assertion = await startAuthentication({
        optionsJSON: passkeyOptions as Parameters<typeof startAuthentication>[0]['optionsJSON']
      })
      const result = await AuthFetch.loginPasskeyVerify(assertion)
      if (!result || !result.response.ok) {
        alert(result?.data?.error || 'パスキー認証に失敗しました')
        return
      }
      const role = result.data?.user?.role
      window.location.href = role === 'admin' ? '/dashboard' : '/posts'
    } catch (error) {
      console.error(error)
      alert('パスキー認証がキャンセルされたか失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">ログイン</h2>

      {step === 'email' && (
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            続行
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <p className="text-sm text-gray-600">{email}</p>
          <div>
            <label className="mb-1 block text-sm text-gray-700">パスワード</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            パスワードでログイン
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-gray-600 underline"
          >
            戻る
          </button>
        </form>
      )}

      {step === 'passkey' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{email}</p>
          <p className="text-sm text-gray-700">このアカウントはパスキーでログインします。</p>
          <button
            type="button"
            disabled={loading}
            onClick={handlePasskeyLogin}
            className="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            パスキーでログイン
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-gray-600 underline"
          >
            戻る
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <a href="/forgot-password" className="text-gray-700 underline">
          パスワードを忘れた場合
        </a>
      </p>
    </div>
  )
}
