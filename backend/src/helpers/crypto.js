/**
 * helpers/crypto.js
 * Password hashing using the Web Crypto API (PBKDF2).
 * Works natively in Cloudflare Workers, Deno, and modern browsers.
 * Does NOT require bcryptjs or any Node.js crypto module.
 */

const ITERATIONS = 10
const KEY_LENGTH = 32     // bytes → 256-bit key
const ALGORITHM = 'SHA-256'

/** Encode a string to a Uint8Array */
const encode = (str) => new TextEncoder().encode(str)

/** Convert ArrayBuffer → hex string */
const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

/** Convert hex string → Uint8Array */
const fromHex = (hex) =>
  new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)))

/**
 * Hash a plain-text password.
 * Returns a string in the format:  "<saltHex>:<hashHex>"
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: ALGORITHM },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return `${toHex(salt)}:${toHex(derived)}`
}

/**
 * Verify a plain-text password against a stored hash.
 * Hash must be in the "<saltHex>:<hashHex>" format produced by hashPassword().
 *
 * @param {string} password
 * @param {string} stored   - value from the database
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false

  const salt = fromHex(saltHex)
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: ALGORITHM },
    keyMaterial,
    KEY_LENGTH * 8,
  )

  // Constant-time comparison to prevent timing attacks
  const candidate = new Uint8Array(derived)
  const expected = fromHex(hashHex)
  if (candidate.length !== expected.length) return false

  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate[i] ^ expected[i]
  return diff === 0
}
