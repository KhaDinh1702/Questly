import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { MongoClient } from 'mongodb'

// Reuse MongoDB connection across warm starts
let client

async function getDb(mongoUri) {
  if (!client) {
    client = new MongoClient(mongoUri)
    await client.connect()
  }
  return client.db('questly-db') // Database name is now questly-db
}

const app = new Hono()

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.FRONTEND_URL, 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return corsMiddleware(c, next)
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running!' })
})

// ---------------------------------------------------------------------------
// Example resource: /api/items
// ---------------------------------------------------------------------------
app.get('/api/items', async (c) => {
  const db = await getDb(c.env.MONGODB_URI)
  const items = await db.collection('items').find({}).limit(50).toArray()
  return c.json(items)
})

app.post('/api/items', async (c) => {
  const body = await c.req.json()
  const db = await getDb(c.env.MONGODB_URI)
  const result = await db.collection('items').insertOne({
    ...body,
    createdAt: new Date(),
  })
  return c.json({ insertedId: result.insertedId }, 201)
})

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app
