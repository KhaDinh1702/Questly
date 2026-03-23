/**
 * Grimoire (Quest / Flashcard Set) routes
 * POST /api/grimoire        – create a set
 * GET  /api/grimoire        – list public sets
 * GET  /api/grimoire/:id    – get one set
 * PUT  /api/grimoire/:id    – update (owner only)
 * DELETE /api/grimoire/:id  – delete (owner only)
 */

import { Hono } from 'hono'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { createFlashcardSetDocument, flashcardSetIndexes } from '../models/FlashcardSet'
import { toObjectId } from '../helpers/db'

const grimoire = new Hono()

// List public sets (paginated)
grimoire.get('/', async (c) => {
  const db    = await getDb(c)
  const page  = Math.max(1, parseInt(c.req.query('page')  ?? '1'))
  const limit = Math.min(50, parseInt(c.req.query('limit') ?? '20'))
  const search = c.req.query('q') ?? ''

  const filter = { isPublic: true, ...(search ? { $text: { $search: search } } : {}) }
  const sets = await db.collection('flashcard_sets')
    .find(filter, { projection: { cards: 0 } })
    .sort({ studiedCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()

  return c.json({ sets, page, limit })
})

// Get user's own and acquired sets
grimoire.get('/my', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const dbUser = await db.collection('users').findOne({ _id: toObjectId(user.id) })
  
  const acquiredIds = dbUser?.acquiredGrimoires || []
  const progressMap = dbUser?.grimoireProgress?.reduce((acc, p) => {
    acc[String(p.setId)] = p.progress
    return acc
  }, {}) || {}

  const filter = {
    $or: [
      { creatorId: toObjectId(user.id) },
      { _id: { $in: acquiredIds } }
    ]
  }

  const sets = await db.collection('flashcard_sets')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  // Attach progress
  const enrichedSets = sets.map(set => ({
    ...set,
    progress: progressMap[String(set._id)] || 0,
    acquired: String(set.creatorId) !== String(user.id) // True if acquired, false if owned
  }))

  return c.json({ sets: enrichedSets })
})

// Acquire a public set
grimoire.post('/:id/acquire', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const _id = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)

  const set = await db.collection('flashcard_sets').findOne({ _id })
  if (!set || !set.isPublic) return c.json({ error: 'Set not found or not public' }, 404)
  if (String(set.creatorId) === String(user.id)) return c.json({ error: 'Cannot acquire your own set' }, 400)

  await db.collection('users').updateOne(
    { _id: toObjectId(user.id) },
    { $addToSet: { acquiredGrimoires: _id } }
  )
  await db.collection('flashcard_sets').updateOne(
    { _id },
    { $inc: { studiedCount: 1 } }
  )

  return c.json({ message: 'Set acquired successfully' })
})

// Update study progress
grimoire.post('/:id/progress', requireAuth, async (c) => {
  const db = await getDb(c)
  const user = c.get('user')
  const _id = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)

  const { progress } = await c.req.json()
  if (typeof progress !== 'number') return c.json({ error: 'Progress must be a number' }, 400)

  const dbUser = await db.collection('users').findOne({ _id: toObjectId(user.id) })
  const progressList = dbUser?.grimoireProgress || []
  
  const existing = progressList.find(p => String(p.setId) === String(_id))
  if (existing) {
    if (progress > existing.progress) {
      await db.collection('users').updateOne(
        { _id: toObjectId(user.id), 'grimoireProgress.setId': _id },
        { $set: { 'grimoireProgress.$.progress': Math.min(100, progress), 'grimoireProgress.$.lastStudied': new Date() } }
      )
    }
  } else {
    await db.collection('users').updateOne(
      { _id: toObjectId(user.id) },
      { $push: { grimoireProgress: { setId: _id, progress: Math.min(100, progress), lastStudied: new Date() } } }
    )
  }

  return c.json({ message: 'Progress updated' })
})

// Get a single set with all cards
grimoire.get('/:id', async (c) => {
  const db  = await getDb(c)
  const _id = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)

  const set = await db.collection('flashcard_sets').findOne({ _id })
  if (!set) return c.json({ error: 'Set not found' }, 404)
  if (!set.isPublic) {
    // Allow owner access (JWT optional here; just check auth header)
    const user = c.get('user')
    if (!user || String(user.id) !== String(set.creatorId)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
  }
  return c.json(set)
})

// Create a new set (auth required)
grimoire.post('/', requireAuth, async (c) => {
  const db   = await getDb(c)
  const body = await c.req.json()
  const { title, description, isPublic = true, cards = [] } = body

  if (!title) return c.json({ error: 'Title is required' }, 400)
  if (!Array.isArray(cards) || cards.length < 20) return c.json({ error: 'A Grimoire must have at least 20 cards to be created.' }, 400)

  const user = c.get('user')
  const doc  = createFlashcardSetDocument({
    title, description, isPublic, cards,
    creatorId: toObjectId(user.id),
  })

  const { insertedId } = await db.collection('flashcard_sets').insertOne(doc)
  return c.json({ message: 'Grimoire created', id: insertedId }, 201)
})

// Update a set (owner only)
grimoire.put('/:id', requireAuth, async (c) => {
  const db   = await getDb(c)
  const _id  = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)
  const user = c.get('user')

  const set = await db.collection('flashcard_sets').findOne({ _id })
  if (!set) return c.json({ error: 'Not found' }, 404)
  if (String(set.creatorId) !== String(user.id)) return c.json({ error: 'Forbidden' }, 403)

  const { title, description, isPublic, cards } = await c.req.json()
  // If caller passes cards array, enforce minimum
  if (cards !== undefined && (!Array.isArray(cards) || cards.length < 20)) {
    return c.json({ error: 'A Grimoire must have at least 20 cards.' }, 400)
  }
  await db.collection('flashcard_sets').updateOne(
    { _id },
    { $set: { ...(title && { title }), ...(description !== undefined && { description }), ...(isPublic !== undefined && { isPublic }), ...(cards && { cards }), updatedAt: new Date() } },
  )
  return c.json({ message: 'Grimoire updated' })
})

// Delete a set (owner only)
grimoire.delete('/:id', requireAuth, async (c) => {
  const db   = await getDb(c)
  const _id  = toObjectId(c.req.param('id'))
  if (!_id) return c.json({ error: 'Invalid ID' }, 400)
  const user = c.get('user')

  const set = await db.collection('flashcard_sets').findOne({ _id })
  if (!set) return c.json({ error: 'Not found' }, 404)
  if (String(set.creatorId) !== String(user.id)) return c.json({ error: 'Forbidden' }, 403)

  await db.collection('flashcard_sets').deleteOne({ _id })
  return c.json({ message: 'Grimoire deleted' })
})

export default grimoire
