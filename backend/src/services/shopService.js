/**
 * Shop service
 * Handles buying, selling, and gacha chest rolling.
 */

import { toObjectId } from '../helpers/db'
import { createUserItemDocument } from '../models/UserItem'
import { rollChest } from '../helpers/gacha'
import { SUBSCRIPTION_TIERS, DAILY_LIMITS } from '../config/constants'

/** Buy an item from the shop. Deducts gold. */
export async function buyItem(db, userId, itemId, quantity = 1) {
  const _userId = toObjectId(userId)
  const _itemId = toObjectId(itemId)

  const item = await db.collection('items').findOne({ _id: _itemId })
  if (!item) return { ok: false, reason: 'Item not found' }

  const totalCost = item.price * quantity

  // Atomic deduction (prevents negative gold)
  const result = await db.collection('users').findOneAndUpdate(
    { _id: _userId, gold: { $gte: totalCost } },
    { $inc: { gold: -totalCost }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!result) return { ok: false, reason: 'Insufficient gold' }

  // Add to inventory
  if (item.stackable) {
    // Upsert stackable items
    await db.collection('user_items').updateOne(
      { userId: _userId, itemId: _itemId },
      { $inc: { quantity }, $setOnInsert: createUserItemDocument({ userId: _userId, itemId: _itemId, quantity: 0 }) },
      { upsert: true },
    )
  } else {
    for (let i = 0; i < quantity; i++) {
      await db.collection('user_items').insertOne(
        createUserItemDocument({ userId: _userId, itemId: _itemId }),
      )
    }
  }

  return { ok: true, goldSpent: totalCost, newGoldBalance: result.gold }
}

/** Sell an item from the player's inventory. Adds sellPrice to gold. */
export async function sellItem(db, userId, userItemId) {
  const _userId     = toObjectId(userId)
  const _userItemId = toObjectId(userItemId)

  const userItem = await db.collection('user_items').findOne({ _id: _userItemId, userId: _userId })
  if (!userItem) return { ok: false, reason: 'Item not found in inventory' }
  if (userItem.isEquipped) return { ok: false, reason: 'Cannot sell an equipped item. Unequip it first.' }

  const item = await db.collection('items').findOne({ _id: userItem.itemId })
  if (!item) return { ok: false, reason: 'Item data not found' }

  await db.collection('user_items').deleteOne({ _id: _userItemId })
  await db.collection('users').updateOne(
    { _id: _userId },
    { $inc: { gold: item.sellPrice }, $set: { updatedAt: new Date() } },
  )

  return { ok: true, goldEarned: item.sellPrice }
}

/**
 * Roll a gacha chest for 1 ticket.
 */
export async function rollGachaChest(db, userId) {
  const _userId = toObjectId(userId)
  
  // Atomic ticket deduction
  const result = await db.collection('users').findOneAndUpdate(
    { _id: _userId, ticketCount: { $gte: 1 } },
    { $inc: { ticketCount: -1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  )
  
  // If user wasn't found or ticketCount < 1
  if (!result) {
    return { ok: false, reason: 'Not enough tickets to roll the chest.' }
  }

  // Determine rarity pool
  const rollTarget = rollChest()

  // Pull a random item from that specific type/rarity pool
  const pipeline = [
    { $match: { type: rollTarget.type, rarity: { $in: rollTarget.rarities }, price: { $gt: 0 } } }, 
    { $sample: { size: 1 } }
  ]

  const [item] = await db.collection('items').aggregate(pipeline).toArray()
  // Fallback if no item matched the specific pool (shouldn't happen with our seed, but just in case)
  if (!item) return { ok: false, reason: 'The chest was empty (no items matched the rolled rarity pool).' }

  // Add to inventory
  if (item.stackable) {
    await db.collection('user_items').updateOne(
      { userId: _userId, itemId: item._id },
      { $inc: { quantity: 1 }, $setOnInsert: createUserItemDocument({ userId: _userId, itemId: item._id, quantity: 0 }) },
      { upsert: true }
    )
  } else {
    await db.collection('user_items').insertOne(
      createUserItemDocument({ userId: _userId, itemId: item._id })
    )
  }

  return { ok: true, tierStr: item.rarity, item, newTicketBalance: result.ticketCount }
}
