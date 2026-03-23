/**
 * dungeon_runs collection schema
 * Tracks a player's active or completed dungeon run.
 * Grid uses [x, y] coordinates (0-indexed).
 */

import { DUNGEON, MONSTER_TIER } from '../config/constants'

/**
 * Generate a fresh 5×5 dungeon grid.
 * Cells: 'empty' | 'monster' | 'mini_boss' | 'start' | 'exit'
 */
export function generateGrid(floor, gridSize = DUNGEON.GRID_SIZE) {
  const grid = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill('empty'),
  )

  // Always start at top-left, exit at bottom-right
  grid[0][0] = 'start'
  grid[gridSize - 1][gridSize - 1] = 'exit'

  // Scatter monsters (roughly 40% of cells)
  const monsterCount = Math.floor(gridSize * gridSize * 0.4)
  let placed = 0
  while (placed < monsterCount) {
    const x = Math.floor(Math.random() * gridSize)
    const y = Math.floor(Math.random() * gridSize)
    if (grid[x][y] === 'empty') {
      grid[x][y] = 'monster'
      placed++
    }
  }

  // Place mini-boss near center
  const mid = Math.floor(gridSize / 2)
  if (grid[mid][mid] === 'empty' || grid[mid][mid] === 'monster') {
    grid[mid][mid] = 'mini_boss'
  }

  // Floor 5+: add big boss adjacent to exit
  if (floor >= DUNGEON.BOSS_FLOOR) {
    grid[gridSize - 2][gridSize - 1] = 'big_boss'
  }

  return grid
}

export function createDungeonRunDocument({ userId, floor = 1 }) {
  const gridSize = DUNGEON.GRID_SIZE
  const grid = generateGrid(floor, gridSize)
  const now = new Date()

  return {
    userId,
    floor,
    gridSize,
    grid,           // 2D array of cell strings
    currentX: 0,
    currentY: 0,
    status: 'active',   // 'active' | 'completed' | 'failed'
    monstersDefeated: 0,
    lootCollected: [],  // [userItemId]
    goldEarned: 0,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  }
}

export const dungeonRunIndexes = [
  { key: { userId: 1, status: 1 } },
  { key: { userId: 1, floor: -1 } },
]
