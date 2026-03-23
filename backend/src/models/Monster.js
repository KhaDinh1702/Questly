/**
 * monsters collection schema
 * Defines monster templates. Actual encounter stats are scaled by floor.
 */

import { MONSTER_TIER } from '../config/constants'

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
      hp:      baseStats.hp      ?? 50,
      atk:     baseStats.atk     ?? 10,
      def:     baseStats.def     ?? 5,
      atkSpeed: baseStats.atkSpeed ?? 1.0,
    },
    lootTable,      // weighted random drop table
    goldReward,
    expReward,
    imageUrl,
    createdAt: new Date(),
  }
}

/**
 * Scale monster stats by floor number.
 * Multiplier grows 15% per floor.
 */
export function scaleMonsterStats(baseStats, floor) {
  const mult = 1 + (floor - 1) * 0.15
  return {
    hp:       Math.round(baseStats.hp      * mult),
    atk:      Math.round(baseStats.atk     * mult),
    def:      Math.round(baseStats.def     * mult),
    atkSpeed: baseStats.atkSpeed,  // speed does not scale
  }
}

export const monsterIndexes = [
  { key: { tier: 1 } },
]
