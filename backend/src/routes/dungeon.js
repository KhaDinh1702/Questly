/**
 * Dungeon routes
 * POST /api/dungeon/start        – start a new dungeon run
 * POST /api/dungeon/move         – move on the grid (costs 1 move)
 * POST /api/dungeon/encounter    – resolve combat on current cell
 * POST /api/dungeon/end          – complete or abandon the run
 * GET  /api/dungeon/active       – get current active run state
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import {
  startDungeonRun,
  moveInDungeon,
  resolveEncounter,
  endDungeonRun,
} from '../services/dungeonService'
import { toObjectId } from '../helpers/db'

const dungeon = new Hono()

dungeon.post('/start', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const floor = Math.max(1, parseInt(body.floor ?? 1))

  const result = await startDungeonRun(db, user.id, floor)
  if (!result.ok) return c.json({ error: result.reason, run: result.run }, 400)
  return c.json(result, 201)
})

dungeon.get('/active', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const run  = await db.collection('dungeon_runs').findOne({
    userId: toObjectId(user.id),
    status: 'active',
  })
  if (!run) return c.json({ error: 'No active dungeon run' }, 404)
  return c.json(run)
})

dungeon.post('/move', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { direction } = await c.req.json()

  const validDirections = ['up', 'down', 'left', 'right']
  if (!validDirections.includes(direction)) {
    return c.json({ error: `direction must be one of: ${validDirections.join(', ')}` }, 400)
  }

  const result = await moveInDungeon(db, user.id, direction)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

dungeon.post('/encounter', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { playerAtk, playerDef, playerHp } = await c.req.json()

  if (!playerAtk || !playerDef || !playerHp) {
    return c.json({ error: 'playerAtk, playerDef, and playerHp are required' }, 400)
  }

  const result = await resolveEncounter(db, user.id, { playerAtk, playerDef, playerHp })
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

dungeon.post('/end', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { status = 'completed' } = await c.req.json().catch(() => ({}))

  const allowed = ['completed', 'failed']
  if (!allowed.includes(status)) return c.json({ error: 'status must be completed or failed' }, 400)

  const result = await endDungeonRun(db, user.id, status)
  return c.json(result)
})

export default dungeon
