import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import itemRoutes from './routes/items'

const app = new Hono()

// CORS configuration
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.FRONTEND_URL, 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running!' })
})

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/items', itemRoutes)

// 404 fallback
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app
