import { verify } from 'hono/jwt'
import { getJwtSecret } from '../config/env.js'

/**
 * requireAuth middleware
 * Validates the Bearer JWT in Authorization header.
 * JWT_SECRET is read from c.env (Cloudflare) → .env (local) via getJwtSecret().
 */
export const requireAuth = async (c, next) => {
  const allHeaders = c.req.header()
  const authHeader = allHeaders['authorization'] || allHeaders['Authorization']
  console.log(`[requireAuth] Path: ${c.req.path}, Method: ${c.req.method}, Auth Header:`, authHeader ? authHeader.slice(0, 15) + '...' : 'NONE')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[requireAuth] Failed: missing or malformed token format. Headers:', JSON.stringify(allHeaders))
    return c.json({ error: 'Unauthorized: missing token' }, 401)
  }

  const token = authHeader.slice(7)
  let payload
  try {
    const secret = getJwtSecret(c)
    if (!secret) throw new Error('JWT_SECRET is not configured. Check your .env file.')
    payload = await verify(token, secret, 'HS256')
  } catch (err) {
    console.error('[requireAuth] JWT verify failed:', err.message)
    return c.json({ error: 'Unauthorized: invalid or expired token' }, 401)
  }

  c.set('user', payload)
  await next()
}

/**
 * requireAdmin middleware
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = async (c, next) => {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: admin only' }, 403)
  }
  await next()
}
