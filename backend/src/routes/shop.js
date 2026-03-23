/**
 * Shop routes
 * GET  /api/shop/items        – list all items available to buy
 * POST /api/shop/buy          – purchase an item
 * POST /api/shop/sell         – sell an owned item
 * POST /api/shop/chest/roll   – roll a gacha chest
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { buyItem, sellItem, rollGachaChest } from '../services/shopService'

const shop = new Hono()

shop.get('/items', async (c) => {
  const db   = await getDb(c)
  const type = c.req.query('type')   ?? ''
  const cls  = c.req.query('class')  ?? ''

  const filter = { price: { $gt: 0 } }
  if (type)  filter.type     = type
  if (cls)   filter.reqClass = { $in: [cls, 'all'] }

  const items = await db.collection('items').find(filter).sort({ rarity: 1 }).toArray()
  return c.json(items)
})

shop.post('/buy', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { itemId, quantity = 1 } = await c.req.json()
  if (!itemId) return c.json({ error: 'itemId required' }, 400)

  const result = await buyItem(db, user.id, itemId, quantity)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

shop.post('/sell', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { userItemId } = await c.req.json()
  if (!userItemId) return c.json({ error: 'userItemId required' }, 400)

  const result = await sellItem(db, user.id, userItemId)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

shop.post('/chest/roll', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const result = await rollGachaChest(db, user.id)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

export default shop
