/**
 * User service
 * Handles player progression, subscription, and daily limit resets.
 */

import { ObjectId } from 'mongodb'
import { todayUTC, sanitizeUser, toObjectId } from '../helpers/db'
import { createUserDocument, userIndexes } from '../models/User'
import { SUBSCRIPTION_TIERS, DAILY_LIMITS, BACKPACK_SLOTS } from '../config/constants'

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
  const user = await db.collection('users').findOne({ _id })
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

/** Increment aptitude test count; always allows the test but returns rewardEligible=false when over limit */
export async function useAptitudeTestSlot(db, userId) {
  const col = db.collection('users')
  const _id = toObjectId(userId)
  await maybeResetDaily(col, _id)

  const user = await col.findOne({ _id }, { projection: { subscriptionTier: 1, daily: 1 } })
  if (!user) return { ok: false, reason: 'User not found' }

  const isPremium = user.subscriptionTier !== SUBSCRIPTION_TIERS.FREE
  const limit = isPremium ? DAILY_LIMITS.APTITUDE_TESTS_PREMIUM : DAILY_LIMITS.APTITUDE_TESTS_FREE

  const aptitudeTestsTaken = user.daily?.aptitudeTestsTaken ?? 0
  const rewardEligible = aptitudeTestsTaken < limit

  // Always increment the counter (tracks all attempts)
  await col.updateOne({ _id }, { $inc: { 'daily.aptitudeTestsTaken': 1 } })

  return {
    ok: true,
    rewardEligible,
    remainingTests: Math.max(0, limit - aptitudeTestsTaken - 1),
    limit,
  }
}

/** Equip an item — validates slot compatibility before updating */
export async function equipItem(db, userId, userItemId, slot) {
  const usersCol = db.collection('users')
  const itemsCol = db.collection('user_items')

  const _userId   = toObjectId(userId)
  const _userItemId = toObjectId(userItemId)

  const userItem = await itemsCol.findOne({ _id: _userItemId, userId: _userId })
  if (!userItem) return { ok: false, reason: 'Item not found in inventory' }

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

/** Get leaderboard (top N by totalScore) */
export async function getLeaderboard(db, limit = 50) {
  return db.collection('users')
    .find({}, { projection: { username: 1, level: 1, class: 1, totalScore: 1 } })
    .sort({ totalScore: -1 })
    .limit(limit)
    .toArray()
}
