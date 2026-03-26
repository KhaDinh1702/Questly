/**
 * Reward service
 * Handles granting items and bonuses for subscriptions and special events.
 */

import { toObjectId } from '../helpers/db.js'
import { createUserItemDocument } from '../models/UserItem.js'
import { SUBSCRIPTION_TIERS, RARITY, EQUIP_SLOT, ITEM_TYPE, CLASS } from '../config/constants.js'
import { equipItem } from './userService.js'

/**
 * Grant rewards based on the purchased subscription tier.
 * @param {Db} db - MongoDB database instance
 * @param {string|ObjectId} userId - User ID
 * @param {string} tier - Purchased tier (monthly, 6months, yearly)
 */
export async function grantSubscriptionRewards(db, userId, tier) {
  const _userId = toObjectId(userId)
  const user = await db.collection('users').findOne({ _id: _userId })
  if (!user) return

  console.log(`[REWARD] Granting rewards for ${tier} to user ${userId}`)

  // 1. Grade B Equipment Set (6months or yearly)
  if (tier === SUBSCRIPTION_TIERS.SIX_MONTHS || tier === SUBSCRIPTION_TIERS.YEARLY) {
    await grantGradeBSet(db, user)
  }

  // 2. Grade S Scroll (yearly only)
  if (tier === SUBSCRIPTION_TIERS.YEARLY) {
    await grantGradeSScroll(db, _userId)
  }
}

/**
 * Grant a full set of B-rank equipment and auto-equip it.
 */
async function grantGradeBSet(db, user) {
  const _userId = user._id
  const userClass = user.class || CLASS.WARRIOR

  // Define slots to fill
  const slots = [
    EQUIP_SLOT.HEAD,
    EQUIP_SLOT.BODY,
    EQUIP_SLOT.LEGS,
    EQUIP_SLOT.FEET,
    EQUIP_SLOT.WEAPON
  ]
  
  // Specific accessory slot based on class
  if (userClass === CLASS.WARRIOR) {
    slots.push(EQUIP_SLOT.OFFHAND)
  } else {
    slots.push(EQUIP_SLOT.RING)
  }

  for (const slot of slots) {
    // Find a suitable B-rank item for this slot and class
    // We prioritize items matching the user's class, then fallback to 'all'
    let item = await db.collection('items').findOne({
      rarity: RARITY.B,
      equipSlot: slot,
      reqClass: userClass
    })

    if (!item) {
      item = await db.collection('items').findOne({
        rarity: RARITY.B,
        equipSlot: slot,
        reqClass: 'all'
      })
    }

    if (item) {
      // Grant the item
      const uiDoc = createUserItemDocument({ userId: _userId, itemId: item._id })
      const { insertedId } = await db.collection('user_items').insertOne(uiDoc)
      
      // Auto-equip the item as requested
      // Note: Ring items go into ring1 by default in this bulk reward logic
      const targetSlot = slot === EQUIP_SLOT.RING ? 'ring1' : slot
      await equipItem(db, _userId, insertedId, targetSlot)
      console.log(`[REWARD] Granted and equipped B-rank ${item.name} to slot ${targetSlot}`)
    } else {
      console.warn(`[REWARD] Could not find B-rank item for slot ${slot} and class ${userClass}`)
    }
  }
}

/**
 * Grant one S-rank scroll.
 */
async function grantGradeSScroll(db, userId) {
  const item = await db.collection('items').findOne({
    rarity: RARITY.S,
    type: ITEM_TYPE.SCROLL
  })

  if (item) {
    const uiDoc = createUserItemDocument({ userId, itemId: item._id, quantity: 1 })
    await db.collection('user_items').insertOne(uiDoc)
    console.log(`[REWARD] Granted S-rank ${item.name} to user ${userId}`)
  } else {
    console.warn(`[REWARD] Could not find S-rank scroll for reward`)
  }
}
