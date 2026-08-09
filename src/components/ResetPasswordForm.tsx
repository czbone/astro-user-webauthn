import { useState } from 'react'
import AuthFetch from '@/api-client/auth'

type Props = {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      alert('パスワードは8文字以上にしてください')
      return
    }
    if (password !== confirm) {
      alert('パスワードが一致しません')
      return
    }

    setLoading(true)
    try {
      const result = await AuthFetch.passwordResetConfirm(token, password)
      if (!result || !result.response.ok) {
        alert(result?.data?.error || 'パスワード再設定に失敗しました')
        return
      }
      window.location.href = result.data?.redirectTo || '/setup-passkey'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">新しいパスワードを設定</h2>
      <p className="mb-4 text-sm text-red-700">
        注意: この操作を完了すると、登録済みのパスキーはすべて無効になります。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-700">新しいパスワード</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">確認</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          再設定して続行
        </button>
      </form>
    </div>
  )
}
