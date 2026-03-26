import { MongoClient } from 'mongodb'
import { getMongoUri } from './config/env'

let client = null
let connecting = null  // prevent parallel connect() races

/**
 * Returns the MongoDB database instance.
 * Single long-lived client, reconnects only if truly closed.
 */
export async function getDb(c) {
  let mongoUri = getMongoUri(c)
  if (!mongoUri) throw new Error('MONGODB_URI is not set. Check your .env file or Cloudflare secrets.')
  
  mongoUri = mongoUri.trim();
  console.log(`[DB] Attempting connection with URI starting with: "${mongoUri.substring(0, 15)}..."`);

  // Already connected — reuse
  if (client) return client.db('questly-db')

  // Deduplicate concurrent connection attempts
  if (!connecting) {
    connecting = (async () => {
      try {
        client = new MongoClient(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 15000,
          maxPoolSize: 5,
          minPoolSize: 1,
        })
        await client.connect()
      } catch (err) {
        client = null
        throw err
      } finally {
        connecting = null
      }
    })()
  }

  await connecting
  return client.db('questly-db')
}
