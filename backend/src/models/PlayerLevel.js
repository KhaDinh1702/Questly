/**
 * player_levels collection schema
 * Tracks EXP and level for each player (separate from the main user doc).
 */

/**
 * Build a new PlayerLevel document.
 * @param {{ userId: ObjectId }} opts
 */
export function createPlayerLevelDocument({ userId }) {
  return {
    userId,
    level: 1,
    exp: 0,
    expToNextLevel: 100,  // level * 100
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Calculate EXP required to advance from a given level.
 * Formula: level * 100  (simple linear curve)
 */
export function expForLevel(level) {
  return level * 100
}

export const playerLevelIndexes = [
  { key: { userId: 1 }, options: { unique: true } },
]
