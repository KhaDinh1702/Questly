/**
 * Dungeon routes
 *
 * GET  /api/dungeon/active          – get current active run state
 * POST /api/dungeon/start           – start a new dungeon run
 * POST /api/dungeon/move            – move on the grid (costs 1 move)
 * POST /api/dungeon/combat/start    – begin combat on current cell
 * POST /api/dungeon/combat/action   – execute one combat turn (attack | flee)
 * POST /api/dungeon/chest/open      – open a chest on current cell
 * POST /api/dungeon/shop/visit      – get shop inventory on current cell
 * POST /api/dungeon/next-floor      – advance to next floor via exit
 * POST /api/dungeon/end             – abandon the run
 * GET  /api/dungeon/level           – get player level & EXP
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { toObjectId } from '../helpers/db'
import { requireAuth } from '../middleware/auth'
import {
  startDungeonRun,
  getActiveDungeonRun,
  moveInDungeon,
  startCombat,
  combatAction,
  openChest,
  visitShop,
  nextFloor,
  endDungeonRun,
  getPlayerLevel,
} from '../services/dungeonService'

const dungeon = new Hono()

// ── GET active run ────────────────────────────────────────────
dungeon.get('/active', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const run  = await getActiveDungeonRun(db, user.id)
  if (!run) return c.json({ error: 'No active dungeon run' }, 404)
  return c.json(run)
})

// ── GET player level & stats ───────────────────────────────────
dungeon.get('/level', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const plDoc = await getPlayerLevel(db, user.id)
  const fullUser = await db.collection('users').findOne(
    { _id: toObjectId(user.id) },
    { projection: { stats: 1, gold: 1, statPoints: 1, dungeonMoves: 1 } },
  )
  return c.json({
    ...plDoc,
    stats: fullUser?.stats || {},
    gold: fullUser?.gold || 0,
    statPoints: fullUser?.statPoints || 0,
    turns: fullUser?.dungeonMoves || 0,
  })
})

// ── Start run ─────────────────────────────────────────────────
dungeon.post('/start', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const floor = Math.max(1, parseInt(body.floor ?? 1))

  const result = await startDungeonRun(db, user.id, floor)
  if (!result.ok) return c.json({ error: result.reason, run: result.run }, 400)
  return c.json(result, 201)
})

// ── Move ──────────────────────────────────────────────────────
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

// ── Combat: start ─────────────────────────────────────────────
dungeon.post('/combat/start', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await startCombat(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// ── Combat: action ────────────────────────────────────────────
dungeon.post('/combat/action', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const { action = 'attack', itemId = null } = body

  const validActions = ['attack', 'heavy_attack', 'heal', 'rest', 'flee', 'use_item']
  if (!validActions.includes(action)) {
    return c.json({ error: `action must be one of: ${validActions.join(', ')}` }, 400)
  }

  const result = await combatAction(db, user.id, action, itemId)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// ── Chest ─────────────────────────────────────────────────────
dungeon.post('/chest/open', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await openChest(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// ── Shop ──────────────────────────────────────────────────────
dungeon.post('/shop/visit', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await visitShop(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// ── Next floor ────────────────────────────────────────────────
dungeon.post('/next-floor', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await nextFloor(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// ── End / abandon ─────────────────────────────────────────────
dungeon.post('/end', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await endDungeonRun(db, user.id)
  return c.json(result)
})

export default dungeon
