import { MongoClient } from 'mongodb'

let client

export async function getDb(mongoUri) {
  if (!client) {
    client = new MongoClient(mongoUri)
    await client.connect()
  }
  return client.db('questly-db')
}
