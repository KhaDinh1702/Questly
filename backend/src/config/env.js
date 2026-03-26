/**
 * config/env.js
 * ─────────────────────────────────────────────────────────────
 * Central place for all environment variable access.
 *
 * Wrangler automatically reads `.env` for local dev and injects
 * all variables into `c.env` — no dotenv needed.
 *
 * For production, set secrets with:
 *   wrangler secret put MONGODB_URI
 *   wrangler secret put JWT_SECRET
 *
 */
/**
 * Read an environment variable from c.env (Cloudflare Workers / Wrangler).
 *
 * @param {object} c   - Hono context
 * @param {string} key - Variable name, e.g. 'MONGODB_URI'
 * @returns {string|undefined}
 */
export function getEnv(c, key) {
  // 1️⃣ Cloudflare Workers bindings / .dev.vars
  if (c?.env?.[key] !== undefined) return c.env[key];
  // 2️⃣ Node.js process.env / .env file (dotenv)
  if (typeof process !== 'undefined' && process.env[key] !== undefined) {
    return process.env[key]
  }
  return undefined
}

// ── Typed convenience accessors ───────────────────────────────

/** MongoDB connection URI */
export const getMongoUri = (c) => getEnv(c, 'MONGODB_URI')

/** JWT signing secret */
export const getJwtSecret = (c) => getEnv(c, 'JWT_SECRET')

/** Current environment (development | production) */
export const getNodeEnv = (c) => getEnv(c, 'NODE_ENV') ?? 'production'

/** HTTP port for standalone Node server */
export const getPort = (c) => parseInt(getEnv(c, 'PORT') ?? '8787', 10)
