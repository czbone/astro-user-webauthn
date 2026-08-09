import { Hono } from 'hono'
import auth from '@/server/api/routes/auth'
import admin from '@/server/api/routes/admin'
import devices from '@/server/api/routes/devices'
import posts from '@/server/api/routes/posts'

const app = new Hono()

app.route('/auth', auth)
app.route('/admin', admin)
app.route('/devices', devices)
app.route('/posts', posts)

export default app
