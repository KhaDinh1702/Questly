import { APTITUDE_REWARDS } from '../config/constants.js'

/**
 * Calculate dungeon moves and gold earned from an Aptitude Test result.
 *
 * @param {number} correctPct  - percentage correct (0–100)
 * @returns {{ moves: number, gold: number, tickets: number }}
 */
export function calcAptitudeReward(correctPct) {
  const pct = Math.max(0, Math.min(100, correctPct))
  const {
    PASS_THRESHOLD, PASS_MOVES, MOVES_PER_EXTRA_PERCENT,
    PASS_GOLD, GOLD_PER_10_PERCENT,
  } = APTITUDE_REWARDS

  if (pct < PASS_THRESHOLD) {
    return { moves: 0, gold: 0, tickets: 0 }
  }

  const extra = pct - PASS_THRESHOLD                                  // % above 50
  const moves = PASS_MOVES + Math.floor(extra * MOVES_PER_EXTRA_PERCENT)
  const gold  = PASS_GOLD  + Math.floor(extra / 10) * GOLD_PER_10_PERCENT
  return { moves, gold, tickets: 0 }
}

/**
 * Calculate ticket reward for a single multi-choice question result.
 *
 * @param {number} correctPct  - percentage correct on this question (0–100)
 * @returns {number} tickets earned
 */
export function calcTicketReward(correctPct) {
  const { TICKET_TIER_1_MAX_PCT, TICKET_TIER_1_REWARD, TICKET_TIER_2_MAX_PCT, TICKET_TIER_2_REWARD } = APTITUDE_REWARDS
  if (correctPct <= TICKET_TIER_1_MAX_PCT) return TICKET_TIER_1_REWARD
  if (correctPct <= TICKET_TIER_2_MAX_PCT) return TICKET_TIER_2_REWARD
  return 0
}

/**
 * Convert accumulated tickets to dungeon moves.
 * Every TICKETS_PER_MOVE tickets → 1 move.
 *
 * @param {number} tickets
 * @returns {{ moves: number, remainingTickets: number }}
 */
export function convertTicketsToMoves(tickets) {
  const { TICKETS_PER_MOVE } = APTITUDE_REWARDS
  const moves = Math.floor(tickets / TICKETS_PER_MOVE)
  const remainingTickets = tickets % TICKETS_PER_MOVE
  return { moves, remainingTickets }
}

/**
 * Get the base stats for a given class.
 * @param {'warrior'|'rogue'|'mage'} cls
 * @returns {object}
 */
export function getBaseStats(cls) {
  const bases = {
    warrior: { maxHp: 180, hp: 180, maxMana: 50,  mana: 50,  atk: 20, def: 18, atkSpeed: 1.0, dodgeRate: 0.05, critRate: 0,    critDamage: 0,   lifesteal: 0,    counterRate: 0.10, hpRegen: 5, manaRegen: 0 },
    rogue:   { maxHp: 130, hp: 130, maxMana: 60,  mana: 60,  atk: 22, def: 10, atkSpeed: 1.6, dodgeRate: 0.15, critRate: 0.15, critDamage: 1.5, lifesteal: 0.05, counterRate: 0.05, hpRegen: 2, manaRegen: 0 },
    mage:    { maxHp: 110, hp: 110, maxMana: 100, mana: 100, atk: 10, def: 8,  atkSpeed: 0.7, dodgeRate: 0.03, critRate: 0,    critDamage: 0,   lifesteal: 0,    counterRate: 0,    hpRegen: 1, manaRegen: 5, spellDamage: 30 },
  }
  return bases[cls] || bases.warrior
}

/**
 * Warrior passive: bonus damage = def * 0.15
 * @param {number} def
 * @returns {number}
 */
export function warriorDefBonus(def) {
  return Math.floor(def * 0.15)
}
