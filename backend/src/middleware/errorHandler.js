import { getNodeEnv } from '../config/env'

/**
 * Global error handler for Hono.
 * Masks stack traces & internal details in production.
 */
export const errorHandler = (err, c) => {
  const isDev = getNodeEnv(c) === 'development'
  console.error('[ERROR]', err)

  return c.json(
    {
      error: 'Internal Server Error',
      ...(isDev && { details: err.message, stack: err.stack }),
    },
    500,
  )
}
