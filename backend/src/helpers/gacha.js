import { CHEST_RATES, RARITY } from '../config/constants'

/**
 * Roll a gacha chest for a player.
 * Returns a rarity tier string.
 */
export function rollChest() {
  const rand = Math.random()
  if (rand < CHEST_RATES.SCROLL)                                         return 'scroll'
  if (rand < CHEST_RATES.SCROLL + CHEST_RATES.LEGENDARY)                 return RARITY.S
  if (rand < CHEST_RATES.SCROLL + CHEST_RATES.LEGENDARY + CHEST_RATES.RARE) return RARITY.A
  return RARITY.C // common pool (E, D, C, B)
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
