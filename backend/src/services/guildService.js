/**
 * Guild service
 * Handles guild creation, membership, marketplace, and boss fights.
 */

import { toObjectId } from '../helpers/db.js'
import { createGuildDocument, createGuildListingDocument } from '../models/Guild.js'

export async function createGuild(db, userId, name) {
  const _userId = toObjectId(userId)

  const exists = await db.collection('guilds').findOne({ name })
  if (exists) return { ok: false, reason: 'Guild name already taken' }

  const doc = createGuildDocument({ name, leaderId: _userId })
  const { insertedId } = await db.collection('guilds').insertOne(doc)

  // Assign guildId to user
  await db.collection('users').updateOne({ _id: _userId }, { $set: { guildId: insertedId } })

  return { ok: true, guildId: insertedId }
}

export async function joinGuild(db, userId, guildId) {
  const _userId  = toObjectId(userId)
  const _guildId = toObjectId(guildId)

  const user = await db.collection('users').findOne({ _id: _userId }, { projection: { guildId: 1 } })
  if (user?.guildId) return { ok: false, reason: 'Already in a guild' }

  const now = new Date()
  await db.collection('guilds').updateOne(
    { _id: _guildId },
    { $push: { members: { userId: _userId, role: 'member', joinedAt: now } } },
  )
  await db.collection('users').updateOne({ _id: _userId }, { $set: { guildId: _guildId } })

  return { ok: true }
}

export async function leaveGuild(db, userId) {
  const _userId = toObjectId(userId)
  const user = await db.collection('users').findOne({ _id: _userId }, { projection: { guildId: 1 } })
  if (!user?.guildId) return { ok: false, reason: 'Not in a guild' }

  await db.collection('guilds').updateOne(
    { _id: user.guildId },
    { $pull: { members: { userId: _userId } } },
  )
  await db.collection('users').updateOne({ _id: _userId }, { $set: { guildId: null } })
  return { ok: true }
}

/** Create a guild marketplace listing */
export async function createListing(db, userId, { guildId, userItemId, price, quantity }) {
  const _userId     = toObjectId(userId)
  const _guildId    = toObjectId(guildId)
  const _userItemId = toObjectId(userItemId)

  const userItem = await db.collection('user_items').findOne({ _id: _userItemId, userId: _userId })
  if (!userItem) return { ok: false, reason: 'Item not found in inventory' }

  const doc = createGuildListingDocument({ sellerId: _userId, guildId: _guildId, userItemId: _userItemId, price, quantity })
  const { insertedId } = await db.collection('guild_listings').insertOne(doc)
  return { ok: true, listingId: insertedId }
}

/** Purchase from guild marketplace (costs guild coins) */
export async function purchaseListing(db, buyerId, listingId) {
  const _buyerId    = toObjectId(buyerId)
  const _listingId  = toObjectId(listingId)

  const listing = await db.collection('guild_listings').findOne({ _id: _listingId, status: 'active' })
  if (!listing) return { ok: false, reason: 'Listing not found or already sold' }

  const buyer = await db.collection('users').findOne({ _id: _buyerId }, { projection: { guildCoins: 1, guildId: 1 } })
  if (!buyer || String(buyer.guildId) !== String(listing.guildId)) {
    return { ok: false, reason: 'You must be in the same guild to purchase' }
  }
  if (buyer.guildCoins < listing.price) return { ok: false, reason: 'Insufficient guild coins' }

  // Deduct coins from buyer, pay seller
  await db.collection('users').updateOne({ _id: _buyerId }, { $inc: { guildCoins: -listing.price } })
  await db.collection('users').updateOne({ _id: listing.sellerId }, { $inc: { guildCoins: listing.price } })

  // Transfer item ownership
  await db.collection('user_items').updateOne(
    { _id: listing.userItemId },
    { $set: { userId: _buyerId } },
  )
  await db.collection('guild_listings').updateOne({ _id: _listingId }, { $set: { status: 'sold' } })

  return { ok: true }
}
