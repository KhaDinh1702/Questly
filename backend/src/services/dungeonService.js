/**
 * Dungeon service
 * Manages dungeon run lifecycle, movement, combat, and rewards.
 */

import { ObjectId } from 'mongodb'
import { toObjectId } from '../helpers/db'
import { createDungeonRunDocument } from '../models/DungeonRun'
import { scaleMonsterStats } from '../models/Monster'
import { spendDungeonMove, addResources } from './userService'
import { weightedRandom, rollChest } from '../helpers/gacha'
import { createUserItemDocument } from '../models/UserItem'

/** Create a new dungeon run for a user */
export async function startDungeonRun(db, userId, floor = 1) {
  // Check if user already has an active run
  const existing = await db.collection('dungeon_runs').findOne({
    userId: toObjectId(userId),
    status: 'active',
  })
  if (existing) return { ok: false, reason: 'You already have an active dungeon run', run: existing }

  const doc = createDungeonRunDocument({ userId: toObjectId(userId), floor })
  const { insertedId } = await db.collection('dungeon_runs').insertOne(doc)
  return { ok: true, run: { _id: insertedId, ...doc } }
}

/**
 * Move player on the grid.
 * Costs 1 dungeon move. Returns the cell type encountered.
 *
 * @param {string} direction - 'up' | 'down' | 'left' | 'right'
 * @returns {{ ok, cell, run } | { ok: false, reason }}
 */
export async function moveInDungeon(db, userId, direction) {
  const _userId = toObjectId(userId)

  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run found' }

  // Spend a move
  const moved = await spendDungeonMove(db, userId)
  if (!moved) return { ok: false, reason: 'No dungeon moves remaining' }

  // Calculate new position
  const { gridSize } = run
  let { currentX, currentY } = run
  const deltas = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
  const [dx, dy] = deltas[direction] ?? [0, 0]
  const newX = Math.max(0, Math.min(gridSize - 1, currentX + dx))
  const newY = Math.max(0, Math.min(gridSize - 1, currentY + dy))

  const cell = run.grid[newX][newY]

  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    { $set: { currentX: newX, currentY: newY, updatedAt: new Date() } },
  )

  return { ok: true, cell, position: { x: newX, y: newY } }
}

/**
 * Resolve combat with the current cell's monster.
 * In real implementation this would be turn-based; here we resolve a single attack exchange.
 * Returns loot on victory.
 */
export async function resolveEncounter(db, userId, { playerAtk, playerDef, playerHp }) {
  const _userId = toObjectId(userId)

  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }

  const cell = run.grid[run.currentX][run.currentY]
  if (!['monster', 'mini_boss', 'big_boss'].includes(cell)) {
    return { ok: false, reason: 'No monster on this cell' }
  }

  // Select a monster template based on cell type
  const monster = await db.collection('monsters').findOne({ tier: cell === 'monster' ? 'minion' : cell })
  if (!monster) return { ok: false, reason: 'Monster data missing' }

  const scaledStats = scaleMonsterStats(monster.baseStats, run.floor)

  // Simple combat simulation
  const monsterHp   = scaledStats.hp
  const monsterAtk  = scaledStats.atk
  const monsterDef  = scaledStats.def

  const dmgToMonster = Math.max(1, playerAtk - monsterDef)
  const dmgToPlayer  = Math.max(1, monsterAtk - playerDef)

  const turnsToKill   = Math.ceil(monsterHp / dmgToMonster)
  const turnsToBeKill = Math.ceil(playerHp  / dmgToPlayer)

  const playerWins = turnsToKill <= turnsToBeKill

  if (!playerWins) {
    // Mark run as failed
    await db.collection('dungeon_runs').updateOne(
      { _id: run._id },
      { $set: { status: 'failed', completedAt: new Date() } },
    )
    return { ok: true, victory: false, reason: 'You were defeated' }
  }

  // Victory – distribute loot
  const goldEarned = monster.goldReward + Math.floor(run.floor * 2)
  let lootItemId = null

  if (monster.lootTable?.length) {
    lootItemId = weightedRandom(monster.lootTable)
  } else if (cell !== 'monster') {
    // Mini/big boss always roll the chest
    lootItemId = rollChest()
  }

  // Mark cell as cleared
  const gridCopy = run.grid.map(row => [...row])
  gridCopy[run.currentX][run.currentY] = 'cleared'

  const dungeonUpdate = {
    grid: gridCopy,
    updatedAt: new Date(),
    $inc: { monstersDefeated: 1, goldEarned },
  }

  // Check if player reached exit
  const isExit = gridCopy[run.gridSize - 1][run.gridSize - 1] === 'cleared'

  if (run.currentX === run.gridSize - 1 && run.currentY === run.gridSize - 1) {
    dungeonUpdate.status = 'completed'
    dungeonUpdate.completedAt = new Date()
  }

  await db.collection('dungeon_runs').updateOne({ _id: run._id }, [
    { $set: { grid: gridCopy, updatedAt: new Date(), status: dungeonUpdate.status ?? 'active', completedAt: dungeonUpdate.completedAt ?? null } },
    { $set: { monstersDefeated: { $add: ['$monstersDefeated', 1] }, goldEarned: { $add: ['$goldEarned', goldEarned] } } },
  ])

  // Give gold & exp to the player
  await addResources(db, userId, { gold: goldEarned, exp: monster.expReward })

  // Add loot item to player inventory
  let lootItem = null
  if (lootItemId) {
    const userItemDoc = createUserItemDocument({
      userId: _userId,
      itemId: typeof lootItemId === 'string' ? new ObjectId(lootItemId) : lootItemId,
    })
    const { insertedId } = await db.collection('user_items').insertOne(userItemDoc)
    lootItem = { _id: insertedId, ...userItemDoc }
  }

  return { ok: true, victory: true, goldEarned, lootItem }
}

/** Complete / abandon a dungeon run */
export async function endDungeonRun(db, userId, status = 'completed') {
  const _userId = toObjectId(userId)
  await db.collection('dungeon_runs').updateOne(
    { userId: _userId, status: 'active' },
    { $set: { status, completedAt: new Date() } },
  )
  return { ok: true }
}
