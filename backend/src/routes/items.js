import { Hono } from 'hono'
import { getDb } from '../db'

const items = new Hono()

items.get('/', async (c) => {
  try {
    const db = await getDb(c)
    const results = await db.collection('items').find({}).limit(50).toArray()
    return c.json(results)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

items.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const db = await getDb(c)
    const result = await db.collection('items').insertOne({
      ...body,
      createdAt: new Date(),
    })
    return c.json({ insertedId: result.insertedId }, 201)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

export default items
