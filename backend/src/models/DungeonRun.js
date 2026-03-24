/**
 * dungeon_runs collection schema
 * Tracks a player's active or completed dungeon run.
 *
 * Grid layout: 5×5 using + (cross) shape.
 * Only row 2 (index 2) and column 2 (index 2) are accessible.
 * All other cells are 'wall'.
 *
 * Cross cells indices (9 total):
 *   (0,2), (1,2), (2,0), (2,1), (2,2), (2,3), (2,4), (3,2), (4,2)
 */

import { DUNGEON } from '../config/constants'

/** Return a random connected set of cells */
export function getRandomConnectedCells(gridSize = DUNGEON.GRID_SIZE, targetCount = 10) {
  const cells = []
  const visited = new Set()
  
  // Start at a random position
  let curr = { r: Math.floor(Math.random() * gridSize), c: Math.floor(Math.random() * gridSize) }
  cells.push(curr)
  visited.add(`${curr.r}-${curr.c}`)

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  while (cells.length < targetCount) {
    // Pick a random existing cell to grow from
    const base = cells[Math.floor(Math.random() * cells.length)]
    // Pick a random neighbor
    const dir = dirs[Math.floor(Math.random() * dirs.length)]
    const next = { r: base.r + dir[0], c: base.c + dir[1] }

    if (
      next.r >= 0 && next.r < gridSize &&
      next.c >= 0 && next.c < gridSize &&
      !visited.has(`${next.r}-${next.c}`)
    ) {
      cells.push(next)
      visited.add(`${next.r}-${next.c}`)
    }
  }
  return cells
}

/** Return a cell and its 4 adjacent neighbors within bounds */
export function getVisibleCells(r, c, gridSize = 5) {
  const cells = [{ r, c }]
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc
    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
      cells.push({ r: nr, c: nc })
    }
  }
  return cells
}

/** Shuffle an array in place (Fisher-Yates) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generate a + shaped dungeon floor.
 *
 * @param {number} floor         - 1-based floor number (1–3)
 * @param {number} playerLevel   - player's current level  
 * @param {number} gridSize      - grid size (default 5)
 * @returns {{ grid: string[][], startPos: {r,c}, exitPos: {r,c} }}
 */
export function generateGrid(floor, playerLevel = 1, gridSize = DUNGEON.GRID_SIZE) {
  // Initialise all cells as walls
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('wall'))

  // Fill random connected cells with 'empty'
  const targetCount = 10 + Math.floor(Math.random() * 5) // 10-14 cells
  const accessibleCells = getRandomConnectedCells(gridSize, targetCount)
  for (const { r, c } of accessibleCells) grid[r][c] = 'empty'

  // Shuffle the accessible cells to randomly assign entities
  const pool = shuffle([...accessibleCells])  // copy so we can pop

  const pop = () => pool.pop()

  // 1. Player start
  const startCell = pop()
  grid[startCell.r][startCell.c] = 'start'

  // 3. Boss (mini_boss for floors 1–2, big_boss for floor 3)
  const bossCell = pop()
  grid[bossCell.r][bossCell.c] = floor >= DUNGEON.BOSS_FLOOR ? 'big_boss' : 'mini_boss'

  // 4. Shop (appears every SHOP_EVERY_N_FLOORS)
  let shopCell = null
  if (floor % DUNGEON.SHOP_EVERY_N_FLOORS === 0) {
    shopCell = pop()
    grid[shopCell.r][shopCell.c] = 'shop'
  }

  // 5. Chests
  const chestCount = DUNGEON.CHEST_COUNT
  for (let i = 0; i < chestCount && pool.length > 0; i++) {
    const ch = pop()
    grid[ch.r][ch.c] = 'chest'
  }

  // 6. Monsters – fill remaining cells up to max
  const minionCount = DUNGEON.MINION_COUNT_MIN +
    Math.floor(Math.random() * (DUNGEON.MINION_COUNT_MAX - DUNGEON.MINION_COUNT_MIN + 1))
  for (let i = 0; i < minionCount && pool.length > 0; i++) {
    const m = pop()
    grid[m.r][m.c] = 'monster'
  }

  return { grid, startPos: startCell }
}

/**
 * Build a new dungeon run document.
 */
export function createDungeonRunDocument({ userId, floor = 1, playerLevel = 1 }) {
  const gridSize = DUNGEON.GRID_SIZE
  const { grid, startPos } = generateGrid(floor, playerLevel, gridSize)
  const now = new Date()

  return {
    userId,
    currentFloor: floor,
    totalFloors: DUNGEON.TOTAL_FLOORS,
    playerLevel,        // snapshot at run start
    gridSize,
    grid,               // 2D string array
    currentPos: startPos,   // { r, c }
    visitedCells: getVisibleCells(startPos.r, startPos.c, gridSize),
    status: 'active',       // 'active' | 'completed' | 'failed'
    turnCount: 1,           // Increments every move
    combatState: null,      // populated during combat
    monstersDefeated: 0,
    lootCollected: [],      // [userItemId]
    goldEarned: 0,
    expEarned: 0,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  }
}

export const dungeonRunIndexes = [
  { key: { userId: 1, status: 1 } },
  { key: { userId: 1, currentFloor: -1 } },
]
