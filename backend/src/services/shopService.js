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
 * Roll a gacha chest.
 * Free users must watch an ad (tracked client-side via adsWatched).
 * Premium users roll freely (up to their allowed count).
 */
export async function rollGachaChest(db, userId) {
  const _userId = toObjectId(userId)
  const user = await db.collection('users').findOne({ _id: _userId })
  if (!user) return { ok: false, reason: 'User not found' }

  if (user.subscriptionTier === SUBSCRIPTION_TIERS.FREE) {
    if (user.daily.adsWatched < DAILY_LIMITS.FREE_CHEST_ADS) {
      // Free user hasn't watched enough ads yet (frontend tracks ad completion)
      return { ok: false, reason: 'Watch an ad to roll a free chest' }
    }
  }

  // Determine rarity
  const rarity = rollChest()

  // Pull a random item of that rarity from the items pool
  const pipeline = rarity === 'scroll'
    ? [{ $match: { type: 'scroll' } }, { $sample: { size: 1 } }]
    : [{ $match: { rarity, type: 'equipment' } }, { $sample: { size: 1 } }]

  const [item] = await db.collection('items').aggregate(pipeline).toArray()
  if (!item) return { ok: false, reason: 'No items available in this rarity pool' }

  // Add to inventory
  const userItemDoc = createUserItemDocument({ userId: _userId, itemId: item._id })
  const { insertedId } = await db.collection('user_items').insertOne(userItemDoc)

  return { ok: true, rarity, item, userItemId: insertedId }
}
