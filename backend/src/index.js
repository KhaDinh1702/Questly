import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ── Routes ────────────────────────────────────────────────────
import authRoutes    from './routes/auth'
import gremoireRoutes from './routes/grimoire'
import aptitudeRoutes from './routes/aptitude'
import dungeonRoutes  from './routes/dungeon'
import shopRoutes     from './routes/shop'
import userRoutes     from './routes/users'
import guildRoutes    from './routes/guild'

// ── Middleware ────────────────────────────────────────────────
import { errorHandler }      from './middleware/errorHandler'
import { createRateLimiter } from './middleware/rateLimit'

const app = new Hono()

// ── CORS ─────────────────────────────────────────────────────
// All secrets are read from c.env (Cloudflare Workers secrets).
// DO NOT hardcode MONGODB_URI, JWT_SECRET, or any sensitive value here.
app.use('*', async (c, next) => {
  const isDev = (c.env.NODE_ENV ?? 'production') === 'development'
  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow any localhost port in development for easy local testing
      if (isDev && origin?.startsWith('http://localhost')) return origin
      if (isDev && origin?.startsWith('http://127.0.0.1'))  return origin
      // Production allowed origins
      if (origin === 'https://questly.pages.dev') return origin
      if (origin?.endsWith('.questly.pages.dev'))  return origin
      return null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// ── Global rate limit: 60 requests/minute per IP ──────────────
app.use('*', createRateLimiter({ windowMs: 60_000, max: 60 }))

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() }),
)

// ── Feature routes ────────────────────────────────────────────
app.route('/api/auth',      authRoutes)
app.route('/api/grimoire',  gremoireRoutes)
app.route('/api/aptitude',  aptitudeRoutes)
app.route('/api/dungeon',   dungeonRoutes)
app.route('/api/shop',      shopRoutes)
app.route('/api/users',     userRoutes)
app.route('/api/guild',     guildRoutes)

// ── 404 ───────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

// ── Global error handler ─────────────────────────────────────
app.onError(errorHandler)

export default app
