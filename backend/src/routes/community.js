/**
 * Community / Social routes
 *
 * GET  /api/community/players         - list players (with relationship status)
 * GET  /api/community/leaderboard     - list players sorted by score
 * GET  /api/community/friends         - list accepted friends
 * GET  /api/community/requests        - list incoming friend requests
 * POST /api/community/request         - send friend request
 * POST /api/community/accept          - accept friend request
 * POST /api/community/decline         - decline friend request
 * POST /api/community/remove          - remove friend
 */

import { Hono } from 'hono'
import { getDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { toObjectId } from '../helpers/db.js'

const community = new Hono()

function projectPlayer(u) {
  return {
    _id: u._id,
    username: u.username,
    identityId: u.identityId ?? '0000',
    level: u.level ?? 1,
    totalScore: u.totalScore ?? 0,
    class: u.class ?? u.classProfile?.confirmedClass ?? null,
    subscriptionTier: u.subscriptionTier ?? 'free',
    avatarIcon: u.avatarIcon ?? null,
    avatarColor: u.avatarColor ?? null,
    showFrame: u.showFrame ?? true,
  }
}

function toKey(id) {
  return String(id)
}

async function getRelationshipMaps(usersCol, meId) {
  const me = await usersCol.findOne(
    { _id: meId },
    { projection: { friends: 1, friendRequestsIncoming: 1, friendRequestsOutgoing: 1 } },
  )
  const friendSet = new Set((me?.friends ?? []).map(toKey))
  const incomingSet = new Set((me?.friendRequestsIncoming ?? []).map((r) => toKey(r.fromUserId)))
  const outgoingSet = new Set((me?.friendRequestsOutgoing ?? []).map((r) => toKey(r.toUserId)))
  return { friendSet, incomingSet, outgoingSet }
}

community.get('/players', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const usersCol = db.collection('users')

  const limit = Math.min(200, parseInt(c.req.query('limit') ?? '50', 10))
  const offset = Math.max(0, parseInt(c.req.query('offset') ?? '0', 10))

  const { friendSet, incomingSet, outgoingSet } = await getRelationshipMaps(usersCol, meId)

  const players = await usersCol
    .find(
      {},
      {
        projection: {
          username: 1,
          identityId: 1,
          level: 1,
          totalScore: 1,
          class: 1,
          classProfile: 1,
          subscriptionTier: 1,
          avatarIcon: 1,
          avatarColor: 1,
          showFrame: 1,
        },
      },
    )
    .sort({ level: -1, totalScore: -1 })
    .skip(offset)
    .limit(limit)
    .toArray()

  const list = players.map((p) => {
    const idKey = toKey(p._id)
    let relationship = 'none'
    if (idKey === toKey(meId)) relationship = 'self'
    else if (friendSet.has(idKey)) relationship = 'friend'
    else if (outgoingSet.has(idKey)) relationship = 'outgoing'
    else if (incomingSet.has(idKey)) relationship = 'incoming'

    return { ...projectPlayer(p), relationship }
  })

  return c.json({ players: list, limit, offset })
})

community.get('/leaderboard', requireAuth, async (c) => {
  const db = await getDb(c)
  const limit = Math.min(200, parseInt(c.req.query('limit') ?? '50', 10))

  const players = await db.collection('users')
    .find(
      {},
      {
        projection: {
          username: 1,
          identityId: 1,
          level: 1,
          totalScore: 1,
          class: 1,
          classProfile: 1,
          subscriptionTier: 1,
          avatarIcon: 1,
          avatarColor: 1,
          showFrame: 1,
        },
      },
    )
    .sort({ totalScore: -1, level: -1 })
    .limit(limit)
    .toArray()

  return c.json({ players: players.map(projectPlayer) })
})

community.get('/friends', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const usersCol = db.collection('users')

  const me = await usersCol.findOne({ _id: meId }, { projection: { friends: 1 } })
  const friendIds = (me?.friends ?? []).filter(Boolean)
  if (friendIds.length === 0) return c.json({ friends: [] })

  const friends = await usersCol
    .find(
      { _id: { $in: friendIds } },
      {
        projection: {
          username: 1,
          identityId: 1,
          level: 1,
          totalScore: 1,
          class: 1,
          classProfile: 1,
          subscriptionTier: 1,
          avatarIcon: 1,
          avatarColor: 1,
          showFrame: 1,
        },
      },
    )
    .sort({ level: -1, totalScore: -1 })
    .toArray()

  return c.json({ friends: friends.map(projectPlayer) })
})

community.get('/requests', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const usersCol = db.collection('users')

  const me = await usersCol.findOne(
    { _id: meId },
    { projection: { friendRequestsIncoming: 1 } },
  )
  const incoming = me?.friendRequestsIncoming ?? []
  const fromIds = incoming.map((r) => r.fromUserId).filter(Boolean)
  if (fromIds.length === 0) return c.json({ requests: [], count: 0 })

  const fromUsers = await usersCol
    .find(
      { _id: { $in: fromIds } },
      {
        projection: {
          username: 1,
          identityId: 1,
          level: 1,
          totalScore: 1,
          class: 1,
          classProfile: 1,
          subscriptionTier: 1,
          avatarIcon: 1,
          avatarColor: 1,
          showFrame: 1,
        },
      },
    )
    .toArray()

  const byId = new Map(fromUsers.map((u) => [toKey(u._id), u]))
  const requests = incoming
    .map((r) => {
      const u = byId.get(toKey(r.fromUserId))
      if (!u) return null
      return { from: projectPlayer(u), createdAt: r.createdAt ?? null }
    })
    .filter(Boolean)

  return c.json({ requests, count: requests.length })
})

community.post('/request', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const { toUserId } = await c.req.json()

  const toId = toObjectId(toUserId)
  if (!toId) return c.json({ error: 'Invalid toUserId' }, 400)
  if (toKey(toId) === toKey(meId)) return c.json({ error: 'You cannot add yourself.' }, 400)

  const usersCol = db.collection('users')
  const [me, target] = await Promise.all([
    usersCol.findOne({ _id: meId }, { projection: { friends: 1, friendRequestsOutgoing: 1 } }),
    usersCol.findOne({ _id: toId }, { projection: { friends: 1, friendRequestsIncoming: 1 } }),
  ])
  if (!target) return c.json({ error: 'User not found' }, 404)

  const alreadyFriends = (me?.friends ?? []).some((id) => toKey(id) === toKey(toId))
  if (alreadyFriends) return c.json({ ok: true, status: 'already_friends' })

  const alreadyOutgoing = (me?.friendRequestsOutgoing ?? []).some((r) => toKey(r.toUserId) === toKey(toId))
  if (alreadyOutgoing) return c.json({ ok: true, status: 'already_requested' })

  const now = new Date()
  await Promise.all([
    usersCol.updateOne(
      { _id: meId },
      { $addToSet: { friendRequestsOutgoing: { toUserId: toId, createdAt: now } }, $set: { updatedAt: now } },
    ),
    usersCol.updateOne(
      { _id: toId },
      { $addToSet: { friendRequestsIncoming: { fromUserId: meId, createdAt: now } }, $set: { updatedAt: now } },
    ),
  ])

  return c.json({ ok: true, status: 'requested' })
})

community.post('/accept', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const { fromUserId } = await c.req.json()

  const fromId = toObjectId(fromUserId)
  if (!fromId) return c.json({ error: 'Invalid fromUserId' }, 400)

  const usersCol = db.collection('users')
  const now = new Date()

  await Promise.all([
    usersCol.updateOne(
      { _id: meId },
      {
        $addToSet: { friends: fromId },
        $pull: { friendRequestsIncoming: { fromUserId: fromId } },
        $set: { updatedAt: now },
      },
    ),
    usersCol.updateOne(
      { _id: fromId },
      {
        $addToSet: { friends: meId },
        $pull: { friendRequestsOutgoing: { toUserId: meId } },
        $set: { updatedAt: now },
      },
    ),
  ])

  return c.json({ ok: true })
})

community.post('/decline', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const { fromUserId } = await c.req.json()

  const fromId = toObjectId(fromUserId)
  if (!fromId) return c.json({ error: 'Invalid fromUserId' }, 400)

  const usersCol = db.collection('users')
  const now = new Date()

  await Promise.all([
    usersCol.updateOne(
      { _id: meId },
      { $pull: { friendRequestsIncoming: { fromUserId: fromId } }, $set: { updatedAt: now } },
    ),
    usersCol.updateOne(
      { _id: fromId },
      { $pull: { friendRequestsOutgoing: { toUserId: meId } }, $set: { updatedAt: now } },
    ),
  ])

  return c.json({ ok: true })
})

community.post('/remove', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const meId = toObjectId(user.id)
  const { userId } = await c.req.json()

  const otherId = toObjectId(userId)
  if (!otherId) return c.json({ error: 'Invalid userId' }, 400)

  const usersCol = db.collection('users')
  const now = new Date()
  await Promise.all([
    usersCol.updateOne({ _id: meId }, { $pull: { friends: otherId }, $set: { updatedAt: now } }),
    usersCol.updateOne({ _id: otherId }, { $pull: { friends: meId }, $set: { updatedAt: now } }),
  ])

  return c.json({ ok: true })
})

export default community

