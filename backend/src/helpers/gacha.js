import { CHEST_RATES, RARITY, CHEST_REWARDS } from '../config/constants'

/**
 * Roll a gacha chest for a player.
 * Returns a rarity tier string.
 */
export function rollChest() {
  const rand = Math.random()

  if (rand < CHEST_RATES.SCROLL) {
    return { type: 'scroll', rarities: [RARITY.A, RARITY.B, RARITY.C] } // scrolls
  }

  if (rand < CHEST_RATES.SCROLL + CHEST_RATES.LEGENDARY) {
    return { type: 'equipment', rarities: [RARITY.S, RARITY.SS] } // legendary+ mythic
  }

  if (rand < CHEST_RATES.SCROLL + CHEST_RATES.LEGENDARY + CHEST_RATES.RARE) {
    return { type: 'equipment', rarities: [RARITY.A] } // epic (the previous constants called this rare but A is epic)
  }

  // common pool
  return { type: 'equipment', rarities: [RARITY.B, RARITY.C, RARITY.D, RARITY.E] }
}

/**
 * Roll what type of reward a chest gives (gold, ticket, or item).
 * Higher floors improve item rarity.
 * @param {number} floor - current dungeon floor
 * @returns {{ rewardType: 'gold' | 'ticket' | 'item', amount?: number, itemPool?: object }}
 */
export function rollChestReward(floor) {
  const rand = Math.random()
  const { POOL_RATES, GOLD_BY_FLOOR, TICKETS_BY_FLOOR } = CHEST_REWARDS

  // Decide reward type
  if (rand < POOL_RATES.gold) {
    // Gold reward
    const range = GOLD_BY_FLOOR[floor] || GOLD_BY_FLOOR[5]
    const amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    return { rewardType: 'gold', amount }
  }

  if (rand < POOL_RATES.gold + POOL_RATES.ticket) {
    // Ticket reward
    const range = TICKETS_BY_FLOOR[floor] || TICKETS_BY_FLOOR[5]
    const amount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    return { rewardType: 'ticket', amount }
  }

  // Item reward - better rarity on higher floors
  const itemPool = rollChestWithFloorBonus(floor)
  return { rewardType: 'item', itemPool }
}

/**
 * Roll chest with floor-based rarity upgrade.
 * Higher floors get better item pools.
 * @param {number} floor
 * @returns {object} { type, rarities }
 */
function rollChestWithFloorBonus(floor) {
  const baseRoll = rollChest()

  // No upgrade on floor 1
  if (floor <= 1) return baseRoll

  // Floor 2+: Slight chance to upgrade to better pool
  const upgradeChance = Math.min(0.3 + (floor - 2) * 0.1, 0.5) // 30% at floor 2, up to 50% at floor 6+
  const shouldUpgrade = Math.random() < upgradeChance

  if (!shouldUpgrade) return baseRoll

  // Upgrade logic: shift to better rarity
  if (baseRoll.type === 'equipment') {
    // Common floor 2-3 → Rare floor 3-4 → Legendary floor 4+
    if (floor >= 4 && Math.random() < 0.4) {
      return { type: 'equipment', rarities: [RARITY.S, RARITY.SS] }
    }
    if (floor >= 3 && Math.random() < 0.5) {
      return { type: 'equipment', rarities: [RARITY.A] }
    }
  }

  return baseRoll
}

/**
 * Pick a random item from a loot table array.
 * Each entry: { itemId, weight }
 */
export function weightedRandom(lootTable) {
  const total = lootTable.reduce((sum, e) => sum + e.weight, 0)
  let r = Math.random() * total
  for (const entry of lootTable) {
    r -= entry.weight
    if (r <= 0) return entry.itemId
  }
  return lootTable[lootTable.length - 1].itemId
}

