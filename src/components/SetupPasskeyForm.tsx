import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import AuthFetch from '@/api-client/auth'

export default function SetupPasskeyForm() {
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    try {
      const optionsResult = await AuthFetch.passkeyRegisterOptions()
      if (!optionsResult || !optionsResult.response.ok || !optionsResult.data?.options) {
        alert(optionsResult?.data?.error || 'パスキー登録の開始に失敗しました')
        return
      }

      const attestation = await startRegistration({
        optionsJSON: optionsResult.data.options as Parameters<
          typeof startRegistration
        >[0]['optionsJSON']
      })

      const verifyResult = await AuthFetch.passkeyRegisterVerify(
        attestation,
        deviceName || undefined
      )
      if (!verifyResult || !verifyResult.response.ok) {
        alert(verifyResult?.data?.error || 'パスキー登録に失敗しました')
        return
      }

      const me = await AuthFetch.me()
      window.location.href = me?.user?.role === 'admin' ? '/dashboard' : '/posts'
    } catch (error) {
      console.error(error)
      alert('パスキー登録がキャンセルされたか失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">パスキーを登録</h2>
      <p className="mb-4 text-sm text-gray-600">
        続行するには、この端末にパスキーを登録してください。登録後はパスキーでログインします。
      </p>
      <div className="mb-4">
        <label className="mb-1 block text-sm text-gray-700">デバイス名（任意）</label>
        <input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="例: 自分のノートPC"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={handleRegister}
        className="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
      >
        パスキーを登録する
      </button>
    </div>
  )
}
