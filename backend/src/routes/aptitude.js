/**
 * Aptitude Test routes
 * POST /api/aptitude/start   – start a test session
 * POST /api/aptitude/submit  – submit answers and receive rewards
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { createRateLimiter } from '../middleware/rateLimit'
import { startAptitudeTest, submitAptitudeTest } from '../services/aptitudeService'

const aptitude = new Hono()

// Prevent spamming the test endpoint
const startLimiter = createRateLimiter({ windowMs: 60_000, max: 100 })

aptitude.post('/start', requireAuth, startLimiter, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const questionCount = Math.min(20, parseInt(c.req.query('count') ?? '10'))
  const setId = c.req.query('setId') ?? null
  const mode = (c.req.query('mode') ?? 'real') === 'practice' ? 'practice' : 'real'

  const result = await startAptitudeTest(db, user.id, questionCount, setId, mode)
  if (!result.ok) return c.json({ error: result.reason }, 400)

  return c.json(result)
})

aptitude.post('/submit', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const body = await c.req.json()

  const { totalQuestions, correctAnswers, rewardEligible = true, mode = 'real', setId = null } = body
  if (typeof totalQuestions !== 'number' || typeof correctAnswers !== 'number') {
    return c.json({ error: 'totalQuestions and correctAnswers must be numbers' }, 400)
  }
  if (correctAnswers > totalQuestions) return c.json({ error: 'correctAnswers cannot exceed totalQuestions' }, 400)

  const normalizedMode = mode === 'practice' ? 'practice' : 'real'
  const result = await submitAptitudeTest(db, user.id, {
    totalQuestions,
    correctAnswers,
    rewardEligible,
    mode: normalizedMode,
    setId,
  })
  if (!result.ok) return c.json({ error: result.reason }, 400)

  return c.json(result)
})

export default aptitude
