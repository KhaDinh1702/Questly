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
import { CLASS_CHANGE_COST } from '../config/constants'
import { getBaseStats } from '../helpers/gameLogic'

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

// Removed the free /me/class route to prevent bypass of class change cost.
// Use /me/class/confirm instead.


users.put('/me/class/confirm', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { selectedClass } = await c.req.json()

  const allowedClasses = ['warrior', 'rogue', 'mage']
  if (!allowedClasses.includes(selectedClass)) {
    return c.json({ error: 'Invalid class selection' }, 400)
  }

  const userDoc = await db.collection('users').findOne({ _id: toObjectId(user.id) })
  if (!userDoc) return c.json({ error: 'User not found' }, 404)

  // A change costs money if they ALREADY have a confirmed class AND it's different.
  // Fallback to userDoc.class for legacy users.
  const currentConfirmed = userDoc.classProfile?.confirmedClass || userDoc.class
  const isChanging = currentConfirmed && currentConfirmed !== selectedClass
  const cost = isChanging ? CLASS_CHANGE_COST : 0

  console.log(`[ClassConfirm] User: ${user.id}, From: ${currentConfirmed}, To: ${selectedClass}, Cost: ${cost}`)

  if (cost > 0 && (userDoc.gold ?? 0) < cost) {
    return c.json({ error: `Insufficient gold. Changing class requires ${cost}G. You have ${userDoc.gold ?? 0}G.` }, 400)
  }

  const now = new Date()
  const newBaseStats = getBaseStats(selectedClass)
  
  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    {
      $set: {
        class: selectedClass,
        'classProfile.currentClass': selectedClass,
        'classProfile.confirmedClass': selectedClass,
        'classProfile.lastConfirmedAt': now,
        'stats.maxHp': newBaseStats.maxHp,
        'stats.hp': newBaseStats.hp,
        'stats.maxMana': newBaseStats.maxMana,
        'stats.mana': newBaseStats.mana,
        'stats.atk': newBaseStats.atk,
        'stats.def': newBaseStats.def,
        'stats.atkSpeed': newBaseStats.atkSpeed,
        'stats.dodgeRate': newBaseStats.dodgeRate,
        updatedAt: now,
      },
      $inc: { gold: -cost },
      $addToSet: { 'classProfile.classHistory': selectedClass },
    },
  )

  const updatedGold = (userDoc.gold ?? 0) - cost;

  return c.json({
    message: cost > 0 ? `Class changed to ${selectedClass} for ${cost}G` : 'Class confirmed',
    gold: updatedGold,
    classProfile: {
      currentClass: selectedClass,
      confirmedClass: selectedClass,
      lastConfirmedAt: now,
    },
  })
})

users.put('/me/path/confirm', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const { selectedPath } = await c.req.json()

  const allowedPaths = ['mastery', 'conquest', 'trial']
  if (!allowedPaths.includes(selectedPath)) {
    return c.json({ error: 'Invalid path selection' }, 400)
  }

  const now = new Date()
  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    {
      $set: {
        'pathProfile.currentPath': selectedPath,
        'pathProfile.confirmedPath': selectedPath,
        'pathProfile.lastConfirmedAt': now,
        updatedAt: now,
      },
      $addToSet: { 'pathProfile.pathHistory': selectedPath },
    },
  )

  return c.json({
    message: 'Path confirmed',
    pathProfile: {
      currentPath: selectedPath,
      confirmedPath: selectedPath,
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

users.put('/me/avatar', requireAuth, async (c) => {
  try {
    const db = await getDb(c)
    const user = c.get('user')
    const body = await c.req.json()
    const { avatarIcon, avatarColor, showFrame, selectedFrame } = body

    const validIcons = ['warrior', 'mage', 'rogue', 'archer', 'knight', 'ranger', 'wizard', 'dragon']

    if (!avatarIcon || !validIcons.includes(avatarIcon)) {
      return c.json({ error: 'Invalid avatar icon' }, 400)
    }
    if (!avatarColor) {
      return c.json({ error: 'Invalid avatar color' }, 400)
    }

    // Allow only known frame ids (yearly has two variants).
    const validFrames = [null, undefined, 'monthly_1', '6months_1', '1year_1', '1year_2', 'Knight', 'Legend', 'Squire']
    if (selectedFrame && !validFrames.includes(selectedFrame)) {
      return c.json({ error: `Invalid frame selection: ${selectedFrame}` }, 400)
    }

    const _userId = toObjectId(user.id)
    if (!_userId) throw new Error('Invalid User ID')

    const updateData = { 
      avatarIcon, 
      avatarColor, 
      showFrame: !!showFrame, 
      selectedFrame: selectedFrame ?? null, 
      updatedAt: new Date() 
    }

    await db.collection('users').updateOne(
      { _id: _userId },
      { $set: updateData }
    )

    console.log(`[USER] Avatar updated for ${user.id}:`, updateData)
    return c.json({ message: 'Avatar updated', ...updateData })
  } catch (err) {
    console.error('[USER] Error updating avatar:', err)
    return c.json({ error: 'Failed to update avatar' }, 500)
  }
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
