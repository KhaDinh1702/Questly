/**
 * User service
 * Handles player progression, subscription, and daily limit resets.
 */

import { ObjectId } from 'mongodb'
import { todayUTC, sanitizeUser, toObjectId } from '../helpers/db.js'
import { createUserDocument, userIndexes } from '../models/User.js'
import { SUBSCRIPTION_TIERS, DAILY_LIMITS, BACKPACK_SLOTS } from '../config/constants.js'

export async function ensureUserIndexes(db) {
  const col = db.collection('users')
  for (const { key, options } of userIndexes) {
    await col.createIndex(key, options ?? {})
  }
}

/** Reset daily counters if the user's last reset date was before today */
async function maybeResetDaily(usersCol, userId) {
  const today = todayUTC()
  await usersCol.updateOne(
    { _id: userId, 'daily.lastReset': { $lt: today } },
    {
      $set: {
        'daily.aptitudeTestsTaken': 0,
        'daily.adsWatched': 0,
        'daily.lastReset': today,
      },
    },
  )
}

export async function getUserById(db, userId) {
  const _id = toObjectId(userId)
  if (!_id) return null
  const usersCol = db.collection('users')
  let user = await usersCol.findOne({ _id })
  if (!user) return null

  // Backfill identityId for legacy users.
  if (!user.identityId) {
    const identityId = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    await usersCol.updateOne({ _id }, { $set: { identityId, updatedAt: new Date() } })
    user = { ...user, identityId }
  }

  return sanitizeUser(user)
}

export async function getUserByUsername(db, username) {
  const user = await db.collection('users').findOne({ username })
  return user  // caller strips password if needed
}

/** Spend a dungeon move (returns false if insufficient) */
export async function spendDungeonMove(db, userId) {
  const _id = toObjectId(userId)
  const result = await db.collection('users').findOneAndUpdate(
    { _id, dungeonMoves: { $gte: 1 } },
    { $inc: { dungeonMoves: -1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  return result ?? null
}

/** Add resources to a user (gold, dungeonMoves, tickets, exp, etc.) */
export async function addResources(db, userId, { gold = 0, dungeonMoves = 0, tickets = 0, exp = 0 } = {}) {
  const _id = toObjectId(userId)
  const inc = {}
  if (gold)         inc.gold = gold
  if (dungeonMoves) inc.dungeonMoves = dungeonMoves
  if (tickets)      inc.ticketCount = tickets
  if (exp)          { inc.experience = exp; inc.totalScore = exp }

  await db.collection('users').updateOne({ _id }, { $inc: inc, $set: { updatedAt: new Date() } })
}

/** Deduct a percentage of a user's gold (used for death penalty) */
export async function deductGoldPenalty(db, userId, pct = 0.10) {
  const _id = toObjectId(userId)
  const user = await db.collection('users').findOne({ _id }, { projection: { gold: 1 } })
  if (!user) return 0
  const penalty = Math.floor((user.gold ?? 0) * pct)
  if (penalty > 0) {
    await db.collection('users').updateOne(
      { _id },
      { $inc: { gold: -penalty }, $set: { updatedAt: new Date() } },
    )
  }
  return penalty
}

/** Increment aptitude test count; always allows the test but returns rewardEligible=false when over limit */
export async function useAptitudeTestSlot(db, userId, { increment = true } = {}) {
  const col = db.collection('users')
  const _id = toObjectId(userId)
  await maybeResetDaily(col, _id)

  const user = await col.findOne({ _id }, { projection: { subscriptionTier: 1, daily: 1 } })
  if (!user) return { ok: false, reason: 'User not found' }

  const tier = user.subscriptionTier || SUBSCRIPTION_TIERS.FREE
  const limit = DAILY_LIMITS.APTITUDE_TESTS[tier] || DAILY_LIMITS.APTITUDE_TESTS.free

  const aptitudeTestsTaken = user.daily?.aptitudeTestsTaken ?? 0
  const rewardEligible = aptitudeTestsTaken < limit

  // Increment the counter (tracks all attempts) if requested.
  if (increment) {
    await col.updateOne({ _id }, { $inc: { 'daily.aptitudeTestsTaken': 1 } })
  }

  const remainingTests = increment
    ? Math.max(0, limit - aptitudeTestsTaken - 1)
    : Math.max(0, limit - aptitudeTestsTaken)

  return {
    ok: true,
    rewardEligible,
    remainingTests,
    limit,
  }
}

/** Get max backpack slots for a user based on their tier */
export function getMaxBackpackSlots(user) {
  const tier = user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE
  const base = BACKPACK_SLOTS.BASE
  const bonus = BACKPACK_SLOTS.BONUS[tier] || 0
  return base + bonus
}

// ============================================================
// Flashcard Set Aptitude (Practice vs Real)
// ============================================================
const FLASHCARD_SET_PRACTICE_LIMIT = 5

function flashcardSetTestKey(setId) {
  // Mongo ObjectId -> stable string key in nested objects.
  return String(setId)
}

/**
 * Practice mode: max 5 attempts per flashcard set until the user
 * completes the Real Test for that set.
 */
export async function useAptitudePracticeSlotForFlashcardSet(db, userId, setId) {
  const usersCol = db.collection('users')
  const _userId = toObjectId(userId)
  const key = flashcardSetTestKey(setId)

  const user = await usersCol.findOne(
    { _id: _userId },
    {
      projection: {
        subscriptionTier: 1,
        flashcardSetTests: 1,
      },
    },
  )

  if (!user) return { ok: false, reason: 'User not found' }

  const setState = user.flashcardSetTests?.[key] ?? {}
  const realConsumed = Boolean(setState.realConsumed || setState.realCompleted)
  const practiceAttempts = Number(setState.practiceAttempts ?? 0)

  // After Real Test attempt (finish or leaving), Practice becomes unlimited.
  if (realConsumed) {
    return {
      ok: true,
      rewardEligible: false,
      remainingPracticeAttempts: null,
      practiceAttempts,
    }
  }

  // Before Real completion, Practice is capped.
  if (practiceAttempts >= FLASHCARD_SET_PRACTICE_LIMIT) {
    return {
      ok: false,
      reason: 'Practice is locked. Complete the Real Test to unlock unlimited practice.',
    }
  }

  const nextAttempts = practiceAttempts + 1
  await usersCol.updateOne(
    { _id: _userId },
    {
      $inc: { [`flashcardSetTests.${key}.practiceAttempts`]: 1 },
      $set: { [`flashcardSetTests.${key}.updatedAt`]: new Date() },
    },
  )

  const remainingPracticeAttempts = Math.max(0, FLASHCARD_SET_PRACTICE_LIMIT - nextAttempts)
  return {
    ok: true,
    rewardEligible: false,
    practiceAttempts: nextAttempts,
    remainingPracticeAttempts,
  }
}

/**
 * Real mode: only 1 completion per flashcard set, but daily quota
 * (pricing system) controls reward eligibility / rewards availability.
 */
export async function useAptitudeRealTestSlotForFlashcardSet(db, userId, setId) {
  const usersCol = db.collection('users')
  const _userId = toObjectId(userId)
  const key = flashcardSetTestKey(setId)

  const user = await usersCol.findOne(
    { _id: _userId },
    { projection: { flashcardSetTests: 1 } },
  )
  if (!user) return { ok: false, reason: 'User not found' }

  const setState = user.flashcardSetTests?.[key] ?? {}
  const realConsumed = Boolean(setState.realConsumed || setState.realCompleted)
  if (realConsumed) {
    return { ok: false, reason: 'Real Test already consumed for this flashcard set.' }
  }

  // Check daily quota without consuming it yet.
  const quotaSlot = await useAptitudeTestSlot(db, userId, { increment: false })
  if (!quotaSlot.ok) return quotaSlot
  if (!quotaSlot.rewardEligible) {
    return {
      ok: false,
      reason: 'Real Test daily limit reached. Try again tomorrow.',
    }
  }

  // Consume 1 Real Test for this flashcard set immediately (even if the user leaves).
  // This is the anti-spam lock that prevents repeatedly taking the same Real Test set.
  const now = new Date()
  const lockRes = await usersCol.updateOne(
    {
      _id: _userId,
      [`flashcardSetTests.${key}.realConsumed`]: { $ne: true },
      [`flashcardSetTests.${key}.realCompleted`]: { $ne: true }, // legacy users
    },
    {
      $set: {
        [`flashcardSetTests.${key}.realConsumed`]: true,
        [`flashcardSetTests.${key}.realConsumedAt`]: now,
        [`flashcardSetTests.${key}.updatedAt`]: now,
      },
      $inc: { [`flashcardSetTests.${key}.realAttempts`]: 1 },
    },
  )
  if (lockRes.matchedCount === 0) {
    // Race: someone else already consumed it.
    return { ok: false, reason: 'Real Test already consumed for this flashcard set.' }
  }

  // Now consume daily quota counter for Real Test attempt.
  const slot = await useAptitudeTestSlot(db, userId, { increment: true })
  if (!slot.ok) return slot

  return {
    ...slot,
    remainingPracticeAttempts: null,
  }
}

/**
 * Marks the Real Test as completed for a flashcard set, which unlocks
 * unlimited practice for that set.
 */
export async function completeAptitudeRealTestForFlashcardSet(db, userId, setId) {
  const usersCol = db.collection('users')
  const _userId = toObjectId(userId)
  const key = flashcardSetTestKey(setId)
  const now = new Date()

  const res = await usersCol.updateOne(
    {
      _id: _userId,
      $or: [
        { [`flashcardSetTests.${key}.realConsumed`]: true },
        // Legacy alias
        { [`flashcardSetTests.${key}.realCompleted`]: true },
      ],
    },
    {
      $set: {
        // Mark that the user actually submitted the Real Test.
        // Practice unlocking is based on realConsumed, so this is only for reward auditing.
        [`flashcardSetTests.${key}.realSubmitted`]: true,
        [`flashcardSetTests.${key}.realSubmittedAt`]: now,
        // Backward compat: keep realCompleted as an alias.
        [`flashcardSetTests.${key}.realCompleted`]: true,
        [`flashcardSetTests.${key}.updatedAt`]: now,
      },
    },
  )
  return { ok: true }
}

/** Equip an item — validates slot compatibility before updating */
export async function equipItem(db, userId, userItemId, slot) {
  const usersCol = db.collection('users')
  const itemsCol = db.collection('user_items')
  const itemMasterCol = db.collection('items')

  const _userId   = toObjectId(userId)
  const _userItemId = toObjectId(userItemId)

  const userItem = await itemsCol.findOne({ _id: _userItemId, userId: _userId })
  if (!userItem) return { ok: false, reason: 'Item not found in inventory' }

  const masterItem = await itemMasterCol.findOne({ _id: userItem.itemId })
  if (!masterItem) return { ok: false, reason: 'Item data not found' }
  if (masterItem.type !== 'equipment') return { ok: false, reason: 'Only equipment can be equipped' }

  const slotFromItem = masterItem.equipSlot
  const ringSlot = slot === 'ring1' || slot === 'ring2'
  const slotValidForItem =
    slotFromItem === slot ||
    (slotFromItem === 'ring' && ringSlot)

  if (!slotValidForItem) {
    return { ok: false, reason: `This item can only be equipped in "${slotFromItem}"` }
  }

  // Unequip previous item in that slot
  await itemsCol.updateMany(
    { userId: _userId, slotEquipped: slot },
    { $set: { isEquipped: false, slotEquipped: null } },
  )

  // Equip the new one
  await itemsCol.updateOne(
    { _id: _userItemId },
    { $set: { isEquipped: true, slotEquipped: slot } },
  )

  // Update user's equipped map
  await usersCol.updateOne(
    { _id: _userId },
    { $set: { [`equipped.${slot}`]: _userItemId, updatedAt: new Date() } },
  )

  return { ok: true }
}

/** Unequip an owned equipped item */
export async function unequipItem(db, userId, userItemId) {
  const usersCol = db.collection('users')
  const itemsCol = db.collection('user_items')

  const _userId = toObjectId(userId)
  const _userItemId = toObjectId(userItemId)

  const userItem = await itemsCol.findOne({ _id: _userItemId, userId: _userId })
  if (!userItem) return { ok: false, reason: 'Item not found in inventory' }
  if (!userItem.isEquipped || !userItem.slotEquipped) {
    return { ok: false, reason: 'Item is not equipped' }
  }

  const slot = userItem.slotEquipped

  await itemsCol.updateOne(
    { _id: _userItemId },
    { $set: { isEquipped: false, slotEquipped: null } },
  )

  await usersCol.updateOne(
    { _id: _userId },
    { $set: { [`equipped.${slot}`]: null, updatedAt: new Date() } },
  )

  return { ok: true, slot }
}

/** Get leaderboard (top N by totalScore) */
export async function getLeaderboard(db, limit = 50) {
  return db.collection('users')
    .find({}, { projection: { username: 1, level: 1, class: 1, totalScore: 1 } })
    .sort({ level: -1, totalScore: -1 })
    .limit(limit)
    .toArray()
}

/** Spend stat points to upgrade a chosen stat */
export async function allocateStatPoints(db, userId, statKey, amount = 1) {
  const _id = toObjectId(userId)
  const spend = Math.max(1, Number(amount) || 1)
  const allowed = ['hp', 'mp', 'ad', 'ap', 'armor', 'mr']
  if (!allowed.includes(statKey)) return { ok: false, reason: 'Invalid stat key' }

  const statPathMap = {
    hp: ['stats.maxHp', 'stats.hp'],
    mp: ['stats.maxMana', 'stats.mana'],
    ad: ['stats.ad'],
    ap: ['stats.ap'],
    armor: ['stats.armor'],
    mr: ['stats.mr'],
  }
  const gainMap = { hp: 12, mp: 10, ad: 2, ap: 2, armor: 2, mr: 1 }

  const user = await db.collection('users').findOne({ _id }, { projection: { statPoints: 1 } })
  if (!user) return { ok: false, reason: 'User not found' }
  const available = user.statPoints ?? 0
  if (available < spend) return { ok: false, reason: 'Not enough stat points' }

  const gain = gainMap[statKey] * spend
  const inc = { statPoints: -spend }
  for (const path of statPathMap[statKey]) {
    inc[path] = gain
  }

  await db.collection('users').updateOne(
    { _id, statPoints: { $gte: spend } },
    { $inc: inc, $set: { updatedAt: new Date() } },
  )

  const updated = await db.collection('users').findOne(
    { _id },
    { projection: { statPoints: 1, stats: 1 } },
  )
  return { ok: true, statPoints: updated?.statPoints ?? 0, stats: updated?.stats ?? {} }
}
