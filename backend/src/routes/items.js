import { Hono } from 'hono'
import { getDb } from '../db'

const items = new Hono()

items.get('/', async (c) => {
  const db = await getDb(c.env.MONGODB_URI)
  const results = await db.collection('items').find({}).limit(50).toArray()
  return c.json(results)
})

items.post('/', async (c) => {
  const body = await c.req.json()
  const db = await getDb(c.env.MONGODB_URI)
  const result = await db.collection('items').insertOne({
    ...body,
    createdAt: new Date(),
  })
  return c.json({ insertedId: result.insertedId }, 201)
})

export default items
