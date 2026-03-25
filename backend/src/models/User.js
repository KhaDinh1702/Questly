/**
 * users collection schema (reference document)
 *
 * MongoDB does not enforce schemas natively, but this file
 * documents the expected shape and provides a factory to build
 * new user documents consistently.
 */

import { SUBSCRIPTION_TIERS, BACKPACK_SLOTS, CLASS, DAILY_LIMITS } from '../config/constants'
import { getBaseStats } from '../helpers/gameLogic'
import { todayUTC } from '../helpers/db'

/**
 * Build a new User document ready to insert into MongoDB.
 */
export function createUserDocument({
  username,
  email,
  passwordHash,
  selectedClass = null,
  hairStyle = 'default',
  clothesId = 'starter_1',
  accessoryId = null,
  backpackSkin = 'default',
}) {
  const now = new Date()
  const stats = selectedClass ? getBaseStats(selectedClass) : {}

  return {
    // ── Account ───────────────────────────────────────────────
    username,
    email,
    password: passwordHash,         // bcrypt hash
    role: 'user',                   // 'user' | 'admin'

    // ── VIP ───────────────────────────────────────────────────
    subscriptionTier: SUBSCRIPTION_TIERS.FREE,
    subExpiryDate: null,

    // ── Character ─────────────────────────────────────────────
    character: { hairStyle, clothesId, accessoryId, backpackSkin },

    // ── Class & Progression ───────────────────────────────────
    class: selectedClass,           // null until character creation
    classProfile: {
      currentClass: selectedClass,
      confirmedClass: selectedClass,
      classHistory: selectedClass ? [selectedClass] : [],
      lastConfirmedAt: selectedClass ? now : null,
    },
    pathProfile: {
      currentPath: null,
      confirmedPath: null,
      pathHistory: [],
      lastConfirmedAt: null,
    },
    level: 1,
    experience: 0,
    statPoints: 0,                  // unspent stat points

    // ── Stats (merged from base + equipment) ──────────────────
    stats: {
      maxHp: stats.maxHp       ?? 100,
      hp:    stats.hp          ?? 100,
      maxMana: stats.maxMana   ?? 50,
      mana:  stats.mana        ?? 50,
      ad:    stats.ad          ?? 10,
      ap:    stats.ap          ?? 0,
      armor: stats.armor       ?? 5,
      mr:    stats.mr          ?? 5,
      atkSpeed:    stats.atkSpeed    ?? 1.0,
      dodgeRate:   stats.dodgeRate   ?? 0.05,
      critRate:    stats.critRate    ?? 0,
      critDamage:  stats.critDamage  ?? 0,
      lifesteal:   stats.lifesteal   ?? 0,
      counterRate: stats.counterRate ?? 0,
      hpRegen:     stats.hpRegen     ?? 1,
      manaRegen:   stats.manaRegen   ?? 0,
      spellDamage: stats.spellDamage ?? 0,
    },

    // ── Resources ─────────────────────────────────────────────
    gold: 0,
    guildCoins: 0,
    dungeonMoves: 0,
    ticketCount: 0,

    // ── Skills learned ────────────────────────────────────────
    skills: [],                     // [{ skillId, learnedAt }]

    // ── Inventory ─────────────────────────────────────────────
    backpackSlots: BACKPACK_SLOTS.BASE,

    // ── Equipment slots ───────────────────────────────────────
    equipped: {
      head:    null,  // userItemId
      body:    null,
      legs:    null,
      feet:    null,
      weapon:  null,
      offhand: null,
      ring1:   null,
      ring2:   null,
    },

    // ── Daily Limits ──────────────────────────────────────────
    daily: {
      aptitudeTestsTaken: 0,
      adsWatched: 0,
      lastReset: todayUTC(),
    },

    // ── Dungeon State ─────────────────────────────────────────
    activeDungeonRunId: null,

    // ── Community ─────────────────────────────────────────────
    guildId: null,

    // ── Grimoire / Learning ───────────────────────────────────
    acquiredGrimoires: [],          // [ObjectId] of sets acquired from others
    grimoireProgress: [],           // [{ setId: ObjectId, progress: Number, lastStudied: Date }]

    // ── Flashcard Set Tests (Practice vs Real) ───────────────
    // Stored per-set as: flashcardSetTests[setIdString] = { practiceAttempts, realCompleted, ... }
    flashcardSetTests: {},


    // ── Leaderboard ───────────────────────────────────────────
    totalScore: 0,           // sum of exp or a separate score

    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Indexes to create on the users collection (run once on startup).
 * { key, options }
 */
export const userIndexes = [
  { key: { username: 1 }, options: { unique: true } },
  { key: { email: 1 },    options: { unique: true, sparse: true } },
  { key: { totalScore: -1 } },                  // leaderboard
  { key: { guildId: 1 } },
]
