/**
 * monsters collection schema
 * Defines monster templates. Actual encounter stats are scaled by monster level.
 */

import { MONSTER_TIER } from '../config/constants.js'

export function createMonsterDocument({
  name,
  tier = MONSTER_TIER.MINION,  // 'minion' | 'mini_boss' | 'big_boss'
  baseStats = {},
  lootTable = [],   // [{ itemId: ObjectId, weight: number }]
  goldReward = 0,
  expReward = 0,
  imageUrl = null,
}) {
  return {
    name,
    tier,
    baseStats: {
      hp:       baseStats.hp       ?? 50,
      ad:       baseStats.ad       ?? 10,
      ap:       baseStats.ap       ?? 0,
      armor:    baseStats.armor    ?? 5,
      mr:       baseStats.mr       ?? 5,
      atkSpeed: baseStats.atkSpeed ?? 1.0,
    },
    lootTable,
    goldReward,
    expReward,
    imageUrl,
    createdAt: new Date(),
  }
}

/**
 * Scale monster stats by its level.
 * Minion level = floor * 2
 * Boss level = playerLevel + BOSS_LEVEL_BONUS
 *
 * @param {object} baseStats
 * @param {number} monsterLevel
 * @returns {{ hp, atk, def, atkSpeed }}
 */
export function scaleMonsterStats(baseStats, monsterLevel) {
  const mult = 1 + (monsterLevel - 1) * 0.12
  return {
    hp:       Math.round(baseStats.hp      * mult),
    ad:       Math.round(baseStats.ad      * mult),
    ap:       Math.round(baseStats.ap      * mult),
    armor:    Math.round(baseStats.armor   * mult),
    mr:       Math.round(baseStats.mr      * mult),
    atkSpeed: baseStats.atkSpeed,  // speed does not scale
  }
}

/**
 * Get the monster level for a given cell type / floor / playerLevel.
 * @param {'monster'|'mini_boss'|'big_boss'} cellType
 * @param {number} floor
 * @param {number} playerLevel
 * @param {number} bossBonus
 */
export function getMonsterLevel(cellType, floor, playerLevel, bossBonus = 2) {
  if (cellType === 'monster')   return floor
  if (cellType === 'mini_boss') return playerLevel
  if (cellType === 'big_boss')  return playerLevel + bossBonus
  return floor
}

export const monsterIndexes = [
  { key: { tier: 1 } },
]
