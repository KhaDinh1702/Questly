/**
 * user_items collection schema
 * Represents a specific item instance owned by a player.
 * Allows per-instance tracking (equipped state, quantity, future upgrades).
 */

export function createUserItemDocument({
  userId,     // ObjectId
  itemId,     // ObjectId → items collection
  quantity = 1,
  isEquipped = false,
  slotEquipped = null,   // 'head' | 'body' | 'weapon' | etc.
  level = 0,             // reserved for future upgrade system
}) {
  return {
    userId,
    itemId,
    quantity,
    isEquipped,
    slotEquipped,
    level,
    acquiredAt: new Date(),
  }
}

export const userItemIndexes = [
  { key: { userId: 1 } },
  { key: { userId: 1, itemId: 1 } },
  { key: { userId: 1, isEquipped: 1 } },
]
