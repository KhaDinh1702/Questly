import { MongoClient } from 'mongodb'

let client

export async function getDb(mongoUri) {
  if (!client) {
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    })
    await client.connect()
  }
  return client.db('questly-db')
}
