import { apiFetch, readJson } from './http'

class AdminFetch {
  async getStats() {
    const res = await apiFetch('/admin/stats')
    if (!res) return null
    return {
      response: res,
      data: await readJson<{
        userCount: number
        adminCount: number
        postCount: number
        publishedPostCount: number
        error?: string
      }>(res)
    }
  }

  async getUsers() {
    const res = await apiFetch('/admin/users')
    if (!res) return null
    return { response: res, data: await readJson<unknown>(res) }
  }

  async createUser(input: { email: string; name: string; role: 'admin' | 'user' }) {
    const res = await apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(input)
    })
    if (!res) return null
    return { response: res, data: await readJson<{ error?: string }>(res) }
  }
}

export default new AdminFetch()
