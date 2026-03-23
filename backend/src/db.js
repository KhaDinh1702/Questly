import { MongoClient } from 'mongodb'
import { getMongoUri } from './config/env'

let client = null
let connecting = null  // prevent parallel connect() races

/**
 * Returns the MongoDB database instance.
 * Single long-lived client, reconnects only if truly closed.
 */
export async function getDb(c) {
  const mongoUri = getMongoUri(c)
  if (!mongoUri) throw new Error('MONGODB_URI is not set. Check your .env file or Cloudflare secrets.')

  // Already connected — reuse
  if (client) return client.db('questly-db')

  // Deduplicate concurrent connection attempts
  if (!connecting) {
    connecting = (async () => {
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 5,
        minPoolSize: 1,
      })
      await client.connect()
      connecting = null
    })()
  }

  await connecting
  return client.db('questly-db')
}
