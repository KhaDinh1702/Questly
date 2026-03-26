import { MongoClient } from 'mongodb'
import { getMongoUri } from './config/env.js'

let client = null
let connecting = null

/**
 * Returns the MongoDB database instance.
 * Persistent connection for Node.js environments (Render, etc.)
 */
export async function getDb(c) {
  if (client) return client.db('questly-db')

  if (!connecting) {
    connecting = (async () => {
      const mongoUri = getMongoUri(c)
      if (!mongoUri) throw new Error('MONGODB_URI is not set. Check your environment variables.')

      console.log('[DB] Connecting to MongoDB Atlas...')
      const newClient = new MongoClient(mongoUri.trim())
      await newClient.connect()
      console.log('[DB] Connected successfully')
      client = newClient
      return client.db('questly-db')
    })()
  }

  return connecting
}
