/**
 * Guild routes
 * POST /api/guild              – create a guild
 * POST /api/guild/join         – join an existing guild
 * POST /api/guild/leave        – leave current guild
 * GET  /api/guild/:id          – get guild info
 * POST /api/guild/market/list  – list item on guild marketplace
 * POST /api/guild/market/buy   – purchase a marketplace listing
 * GET  /api/guild/market       – browse guild marketplace
 */

import { Hono } from 'hono'
import { getDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { createGuild, joinGuild, leaveGuild, createListing, purchaseListing } from '../services/guildService.js'
import { toObjectId } from '../helpers/db.js'

const guild = new Hono()

guild.post('/', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { name } = await c.req.json()
  if (!name) return c.json({ error: 'Guild name required' }, 400)

  const result = await createGuild(db, user.id, name)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result, 201)
})

guild.get('/:id', async (c) => {
  const db   = await getDb(c)
  const _id  = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)

  const g = await db.collection('guilds').findOne({ _id })
  if (!g) return c.json({ error: 'Guild not found' }, 404)
  return c.json(g)
})

guild.post('/join', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { guildId } = await c.req.json()
  if (!guildId) return c.json({ error: 'guildId required' }, 400)

  const result = await joinGuild(db, user.id, guildId)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

guild.post('/leave', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await leaveGuild(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

// Guild Marketplace
guild.get('/market', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const u = await db.collection('users').findOne({ _id: toObjectId(user.id) }, { projection: { guildId: 1 } })
  if (!u?.guildId) return c.json({ error: 'You must be in a guild to view the marketplace' }, 403)

  const listings = await db.collection('guild_listings')
    .aggregate([
      { $match: { guildId: u.guildId, status: 'active' } },
      { $lookup: { from: 'user_items', localField: 'userItemId', foreignField: '_id', as: 'userItem' } },
      { $unwind: '$userItem' },
      { $lookup: { from: 'items', localField: 'userItem.itemId', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
    ])
    .toArray()

  return c.json(listings)
})

guild.post('/market/list', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { userItemId, price, quantity = 1 } = await c.req.json()
  if (!userItemId || !price) return c.json({ error: 'userItemId and price required' }, 400)

  const u = await db.collection('users').findOne({ _id: toObjectId(user.id) }, { projection: { guildId: 1 } })
  if (!u?.guildId) return c.json({ error: 'You must be in a guild' }, 403)

  const result = await createListing(db, user.id, { guildId: u.guildId, userItemId, price, quantity })
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result, 201)
})

guild.post('/market/buy', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { listingId } = await c.req.json()
  if (!listingId) return c.json({ error: 'listingId required' }, 400)

  const result = await purchaseListing(db, user.id, listingId)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

export default guild
