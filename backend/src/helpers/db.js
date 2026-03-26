import { ObjectId } from 'mongodb'
import { DB_NAME } from '../config/constants.js'

/**
 * Returns the MongoDB db instance and the named collection.
 * mongoUri is resolved via getEnv(c, 'MONGODB_URI') — reads from .env or Cloudflare secrets.
 */
export function getCollection(db, name) {
  return db.collection(name)
}

/** Safely convert a string to ObjectId, returns null on failure */
export function toObjectId(id) {
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

/** Strip sensitive fields before returning a user object to the client */
export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

/** Return the current UTC date truncated to midnight (for daily resets) */
export function todayUTC() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Shallow-merge stat overrides onto a base stat object */
export function mergeStats(base, overrides = {}) {
  return { ...base, ...overrides }
}
