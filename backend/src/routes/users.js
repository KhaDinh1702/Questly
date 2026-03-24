/**
 * User / Profile routes
 * GET  /api/users/me                – get own profile
 * PUT  /api/users/me/character      – update character appearance
 * PUT  /api/users/me/equip          – equip an item
 * GET  /api/users/me/inventory      – list owned items
 * GET  /api/users/leaderboard       – top players
 * GET  /api/users/:username         – public community profile
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { getUserById, getUserByUsername, getLeaderboard, equipItem, unequipItem, allocateStatPoints } from '../services/userService'
import { toObjectId } from '../helpers/db'

const users = new Hono()

users.get('/me', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const profile = await getUserById(db, user.id)
  if (!profile) return c.json({ error: 'User not found' }, 404)
  return c.json(profile)
})

users.put('/me/character', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { hairStyle, clothesId, accessoryId, backpackSkin } = await c.req.json()

  const update = {}
  if (hairStyle   !== undefined) update['character.hairStyle']   = hairStyle
  if (clothesId   !== undefined) update['character.clothesId']   = clothesId
  if (accessoryId !== undefined) update['character.accessoryId'] = accessoryId
  if (backpackSkin!== undefined) update['character.backpackSkin']= backpackSkin

  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    { $set: { ...update, updatedAt: new Date() } },
  )
  return c.json({ message: 'Character updated' })
})

users.put('/me/class', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { selectedClass } = await c.req.json()

  const allowedClasses = ['warrior', 'rogue', 'mage']
  if (!allowedClasses.includes(selectedClass)) {
    return c.json({ error: 'Invalid class selection' }, 400)
  }

  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    { $set: { class: selectedClass, updatedAt: new Date() } },
  )

  return c.json({ message: 'Class updated', class: selectedClass })
})

users.put('/me/class/confirm', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { selectedClass } = await c.req.json()

  const allowedClasses = ['warrior', 'rogue', 'mage']
  if (!allowedClasses.includes(selectedClass)) {
    return c.json({ error: 'Invalid class selection' }, 400)
  }

  const now = new Date()
  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    {
      $set: {
        class: selectedClass,
        'classProfile.currentClass': selectedClass,
        'classProfile.confirmedClass': selectedClass,
        'classProfile.lastConfirmedAt': now,
        updatedAt: now,
      },
      $addToSet: { 'classProfile.classHistory': selectedClass },
    },
  )

  return c.json({
    message: 'Class confirmed',
    classProfile: {
      currentClass: selectedClass,
      confirmedClass: selectedClass,
      lastConfirmedAt: now,
    },
  })
})

users.put('/me/equip', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')
  const { userItemId, slot } = await c.req.json()
  if (!userItemId || !slot) return c.json({ error: 'userItemId and slot required' }, 400)

  const result = await equipItem(db, user.id, userItemId, slot)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json({ message: 'Item equipped' })
})

users.put('/me/unequip', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { userItemId } = await c.req.json()
  if (!userItemId) return c.json({ error: 'userItemId required' }, 400)

  const result = await unequipItem(db, user.id, userItemId)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json({ message: 'Item unequipped', slot: result.slot })
})

users.put('/me/stats/allocate', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { statKey, amount = 1 } = await c.req.json()
  if (!statKey) return c.json({ error: 'statKey required' }, 400)

  const result = await allocateStatPoints(db, user.id, statKey, amount)
  if (!result.ok) return c.json({ error: result.reason }, 400)
  return c.json(result)
})

users.get('/me/inventory', requireAuth, async (c) => {
  const db   = await getDb(c)
  const user = c.get('user')

  const items = await db.collection('user_items')
    .aggregate([
      { $match: { userId: toObjectId(user.id) } },
      { $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $sort: { 'item.rarity': -1, acquiredAt: -1 } },
    ])
    .toArray()

  return c.json(items)
})

users.get('/leaderboard', async (c) => {
  const db = await getDb(c)
  const limit = Math.min(100, parseInt(c.req.query('limit') ?? '50'))
  const board = await getLeaderboard(db, limit)
  return c.json(board)
})

// Public community profile
users.get('/:username', async (c) => {
  const db   = await getDb(c)
  const user = await getUserByUsername(db, c.req.param('username'))
  if (!user) return c.json({ error: 'User not found' }, 404)

  // Expose only public fields
  const { password, email, daily, ...pub } = user
  return c.json(pub)
})

export default users
