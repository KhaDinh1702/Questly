import { getNodeEnv } from '../config/env.js'

/**
 * Global error handler for Hono.
 * Masks stack traces & internal details in production.
 */
export const errorHandler = (err, c) => {
  const isDev = getNodeEnv(c) === 'development'
  console.error('[ERROR]', err)

  const res = c.json(
    {
      error: 'Internal Server Error',
      ...(isDev && { details: err.message, stack: err.stack }),
    },
    500,
  )

  // Ensure CORS headers even on error responses
  const origin = c.req.header('Origin')
  if (origin && (origin === 'https://questly.pages.dev' || origin.endsWith('.questly.pages.dev') || origin.startsWith('http://localhost'))) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return res
}
