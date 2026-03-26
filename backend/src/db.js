import { MongoClient, ServerApiVersion } from 'mongodb'
import { getMongoUri } from './config/env'

let client = null

/**
 * Returns the MongoDB database instance.
 * Uses a LAZY CONNECT strategy for Cloudflare Workers to avoid "Worker code had hung" errors.
 */
export async function getDb(c) {
  const mongoUri = getMongoUri(c)
  if (!mongoUri) throw new Error('MONGODB_URI is not set. Check your Cloudflare secrets.')

  // If client exists, check if it's actually initialized
  if (client) {
    return client.db('questly-db')
  }

  console.log(`[DB] initializing new MongoClient (Lazy Mode)...`);
  
  try {
    client = new MongoClient(mongoUri.trim(), {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      // IMPORTANT: In Cloudflare Workers, we must be very careful with connection pooling
      maxPoolSize: 1, 
      minPoolSize: 0,
      serverSelectionTimeoutMS: 20000, // Be patient for the edge connection
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      // No explicit client.connect() here to avoid hanging the promise
    })

    // We don't await client.connect() here. 
    // The first command (like findOne) will trigger the connection.
    
    return client.db('questly-db')
  } catch (err) {
    console.error(`[DB] Error during client initialization:`, err.message)
    client = null
    throw err
  }
}
