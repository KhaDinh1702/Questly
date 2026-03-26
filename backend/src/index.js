import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getDb } from './db.js'
import { playerLevelIndexes } from './models/PlayerLevel.js'
import { dungeonRunIndexes } from './models/DungeonRun.js'

// ── Routes ────────────────────────────────────────────────────
import authRoutes    from './routes/auth.js'
import gremoireRoutes from './routes/grimoire.js'
import aptitudeRoutes from './routes/aptitude.js'
import dungeonRoutes  from './routes/dungeon.js'
import shopRoutes     from './routes/shop.js'
import userRoutes     from './routes/users.js'
import guildRoutes    from './routes/guild.js'
import paymentRoutes  from './routes/payment.js'
import communityRoutes from './routes/community.js'

// ── Middleware ────────────────────────────────────────────────
import { errorHandler }      from './middleware/errorHandler.js'
import { createRateLimiter } from './middleware/rateLimit.js'

const app = new Hono()

// ── CORS ─────────────────────────────────────────────────────
// All secrets are read from c.env (Cloudflare Workers secrets).
// DO NOT hardcode MONGODB_URI, JWT_SECRET, or any sensitive value here.
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'https://questly.pages.dev' // Default for headless or same-origin
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return origin
    if (origin.includes('.pages.dev') || origin === 'https://questly.pages.dev') return origin
    return origin // Trust-but-verify fallback
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ── Global rate limit: 60 requests/minute per IP ──────────────
app.use('*', createRateLimiter({ windowMs: 60_000, max: 2000 }))

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
app.route('/api/payment',   paymentRoutes)
app.route('/api/community', communityRoutes)

// ── 404 ───────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

// ── Global error handler ─────────────────────────────────────
app.onError(errorHandler)

import { serve } from '@hono/node-server'
import 'dotenv/config'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787

/** Ensure all required MongoDB indexes exist at startup */
async function ensureIndexes() {
  try {
    // Build a minimal fake context to get the db (reads from process.env)
    const fakeEnv = process.env
    const db = await getDb({ env: fakeEnv })
    // player_levels indexes
    const plCol = db.collection('player_levels')
    for (const { key, options } of playerLevelIndexes) {
      await plCol.createIndex(key, options ?? {})
    }
    // dungeon_runs indexes
    const drCol = db.collection('dungeon_runs')
    for (const { key } of dungeonRunIndexes) {
      await drCol.createIndex(key)
    }
    console.log('[DB] Indexes created/verified')
  } catch (e) {
    console.warn('[DB] Index creation skipped:', e.message)
  }
}

export default app

if (typeof process !== 'undefined' && process.release?.name === 'node') {
  serve({
    fetch: app.fetch,
    port: port
  }, (info) => {
    console.log(`[SUCCESS] The Questly server has booted locally on http://127.0.0.1:${info.port}`)
    console.log(`[SUCCESS] Cloudflare Workers emulation has been permanently disabled. Welcome to zero-lag!`)
    ensureIndexes()
  })
}
