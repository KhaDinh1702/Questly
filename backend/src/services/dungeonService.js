/**
 * Dungeon service – complete turn-based implementation
 *
 * Exports:
 *   startDungeonRun      – create a new run
 *   getActiveDungeonRun  – fetch active run
 *   moveInDungeon        – move on the + grid (costs 1 dungeon move)
 *   startCombat          – begin a battle on the current cell
 *   combatAction         – execute one turn (attack | flee)
 *   openChest            – open a chest on the current cell
 *   visitShop            – get shop inventory on the current cell
 *   nextFloor            – advance to the next floor through the exit
 *   endDungeonRun        – abandon / force-complete a run
 *   addExpAndLevelUp     – grant EXP and handle level-up
 *   getPlayerLevel       – fetch or create player_levels doc
 */

import { ObjectId } from 'mongodb'
import { toObjectId } from '../helpers/db.js'
import { createDungeonRunDocument, generateGrid, getVisibleCells } from '../models/DungeonRun.js'
import { scaleMonsterStats, getMonsterLevel } from '../models/Monster.js'
import { createPlayerLevelDocument, expForLevel } from '../models/PlayerLevel.js'
import { addResources, getMaxBackpackSlots } from './userService.js'
import { weightedRandom, rollChest, rollChestReward } from '../helpers/gacha.js'
import { createUserItemDocument } from '../models/UserItem.js'
import { DUNGEON, MONSTER_TIER } from '../config/constants.js'
import { getBaseStats } from '../helpers/gameLogic.js'

// ── Helpers ───────────────────────────────────────────────────

/** Fetch (or lazily create) a player_levels document */
async function getOrCreatePlayerLevel(db, userId) {
  const col = db.collection('player_levels')
  const _id = toObjectId(userId)
  let doc = await col.findOne({ userId: _id })
  if (!doc) {
    const newDoc = createPlayerLevelDocument({ userId: _id })
    const { insertedId } = await col.insertOne(newDoc)
    doc = { _id: insertedId, ...newDoc }
  }
  return doc
}

export async function getPlayerLevel(db, userId) {
  return getOrCreatePlayerLevel(db, userId)
}

/**
 * Add EXP to a player; handle multi-level-ups.
 * Returns { level, exp, levelsGained }
 */
export async function addExpAndLevelUp(db, userId, expGained) {
  if (expGained <= 0) return null
  const col = db.collection('player_levels')
  const _id = toObjectId(userId)

  let doc = await getOrCreatePlayerLevel(db, userId)
  let { level, exp } = doc
  let levelsGained = 0

  exp += expGained
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level)
    level += 1
    levelsGained++
  }

  await col.updateOne(
    { userId: _id },
    { $set: { level, exp, expToNextLevel: expForLevel(level), updatedAt: new Date() } },
  )

  // Also sync level to users collection and grant spendable stat points.
  const statPointGainPerLevel = 3
  const statPointsGained = levelsGained * statPointGainPerLevel
  const updateSet = {
    level,
    updatedAt: new Date(),
  }
  const incUpdate = {}
  if (statPointsGained > 0) {
    incUpdate.statPoints = statPointsGained
  }

  // Fully restore Mana on level up using live user maxMana.
  const user = await db.collection('users').findOne(
    { _id },
    { projection: { 'stats.maxMana': 1 } },
  )
  updateSet['stats.mana'] = user?.stats?.maxMana ?? 50

  await db.collection('users').updateOne(
    { _id },
    { 
      $set: updateSet,
      $inc: incUpdate
    }
  )

  return { level, exp, levelsGained, statPointsGained }
}

/** Apply 10% gold death penalty to user */
async function applyDeathPenalty(db, userId) {
  const _id = toObjectId(userId)
  const user = await db.collection('users').findOne({ _id }, { projection: { gold: 1 } })
  if (!user) return 0
  const penalty = Math.floor((user.gold ?? 0) * DUNGEON.DEATH_GOLD_PENALTY)
  if (penalty > 0) {
    await db.collection('users').updateOne(
      { _id },
      { $inc: { gold: -penalty }, $set: { updatedAt: new Date() } },
    )
  }
  return penalty
}

/** Spend dungeon turns (stored as users.dungeonMoves) */
async function spendTurns(db, userId, amount = 1) {
  const _id = toObjectId(userId)
  const spent = Math.max(1, Number(amount) || 1)
  const updated = await db.collection('users').findOneAndUpdate(
    { _id, dungeonMoves: { $gte: spent } },
    { $inc: { dungeonMoves: -spent }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after', projection: { dungeonMoves: 1 } },
  )
  if (!updated) return { ok: false, reason: 'Not enough turns. Complete Aptitude tests to gain more turns.' }
  return { ok: true, remainingTurns: updated.dungeonMoves ?? 0 }
}

/** Get monster template for a cell type, with fallback to inline defaults */
async function getMonsterTemplate(db, cellType) {
  const tier = cellType === 'monster' ? MONSTER_TIER.MINION
             : cellType === 'mini_boss' ? MONSTER_TIER.MINI_BOSS
             : MONSTER_TIER.BIG_BOSS

  const monster = await db.collection('monsters').findOne({ tier })
  if (monster) return monster

  // Fallback templates when the monsters collection is empty
  const defaults = {
    minion:    { name: 'Skeleton',        tier, baseStats: { hp: 30,  ad: 7, ap: 0, armor: 2, mr: 2, atkSpeed: 1.0 }, goldReward: 10, expReward: 15 },
    mini_boss: { name: 'Skeleton Guard',  tier, baseStats: { hp: 80, ad: 10, ap: 0, armor: 4, mr: 4, atkSpeed: 0.9 }, goldReward: 35, expReward: 50 },
    big_boss:  { name: 'Skeleton King',   tier, baseStats: { hp: 150, ad: 15, ap: 5, armor: 6, mr: 6, atkSpeed: 0.8 }, goldReward: 100, expReward: 150 },
  }
  return defaults[tier] ?? defaults.minion
}
/**
 * Ensures player of a given class has healthy stats (no 0 mana if class has mana).
 * Returns the corrected user doc stats.
 */
async function repairPlayerStats(db, user) {
  if (!user || !user.stats) return null
  const _userId = user._id
  
  let { maxHp, maxMana } = user.stats
  let needsUpdate = false
  
  if ((maxMana <= 0 || maxHp < 100) && user.class) {
    const base = getBaseStats(user.class)
    if (maxMana <= 0) {
      maxMana = base.maxMana || 50
      needsUpdate = true
    }
    if (maxHp < base.maxHp) {
      maxHp = base.maxHp || 100
      needsUpdate = true
    }
  }

  if (needsUpdate) {
    await db.collection('users').updateOne(
      { _id: _userId },
      { $set: { 'stats.maxHp': maxHp, 'stats.maxMana': maxMana } }
    )
    user.stats.maxHp = maxHp
    user.stats.maxMana = maxMana
  }
  return user.stats
}

/** Check if position is valid (within cross pattern) */
function isAccessible(grid, r, c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return false
  return grid[r][c] !== 'wall'
}

// ── Public API ────────────────────────────────────────────────

/** Create a new dungeon run for a user */
export async function startDungeonRun(db, userId, floor = 1) {
  // Disallow concurrent runs
  const existing = await db.collection('dungeon_runs').findOne({
    userId: toObjectId(userId),
    status: 'active',
  })
  if (existing) return { ok: false, reason: 'You already have an active dungeon run', run: existing }

  // Heal player to max HP and restore Mana when entering a new dungeon
  const user = await db.collection('users').findOne({ _id: toObjectId(userId) })
  await repairPlayerStats(db, user)
  const maxHp = user.stats.maxHp
  const maxMana = user.stats.maxMana

  await db.collection('users').updateOne(
    { _id: toObjectId(userId) },
    { 
      $set: { 
        'stats.hp': maxHp, 
        'stats.mana': maxMana,
        updatedAt: new Date() 
      } 
    }
  )

  // Get player level
  const plDoc = await getOrCreatePlayerLevel(db, userId)
  const playerLevel = plDoc.level ?? 1

  const doc = createDungeonRunDocument({ userId: toObjectId(userId), floor, playerLevel })
  const { insertedId } = await db.collection('dungeon_runs').insertOne(doc)
  return { ok: true, run: { _id: insertedId, ...doc } }
}

/** Get the currently active run */
export async function getActiveDungeonRun(db, userId) {
  return db.collection('dungeon_runs').findOne({
    userId: toObjectId(userId),
    status: 'active',
  })
}

/**
 * Move player on the grid.
 * Costs 1 dungeon move. Returns the cell type at the new position.
 */
export async function moveInDungeon(db, userId, direction) {
  const _userId = toObjectId(userId)
  const [run, user] = await Promise.all([
    db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' }),
    db.collection('users').findOne({ _id: _userId }, { projection: { stats: 1 } })
  ])
  
  if (!run) return { ok: false, reason: 'No active dungeon run found' }

  if (run.combatState) return { ok: false, reason: 'Finish or flee the current combat first' }

  const { grid, currentPos } = run
  const deltas = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
  const [dr, dc] = deltas[direction] ?? [0, 0]
  const newR = currentPos.r + dr
  const newC = currentPos.c + dc

  if (!isAccessible(grid, newR, newC)) {
    return { ok: false, reason: 'Cannot move there – wall or out of bounds' }
  }

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  const newPos = { r: newR, c: newC }
  const cell = grid[newR][newC]

  // Mana Regeneration during exploration (only for Mage - 5 MP per step)
  const playerClass = user.class || 'warrior'
  const isMageExploring = playerClass === 'mage'
  const explorationManaRegen = isMageExploring ? 5 : 0

  const currentMana = user?.stats?.mana ?? 50
  const maxMana = user?.stats?.maxMana ?? 50
  const newMana = Math.min(maxMana, currentMana + explorationManaRegen)
  
  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    {
      $set: { currentPos: newPos, updatedAt: new Date() },
      $addToSet: { visitedCells: { $each: getVisibleCells(newR, newC, grid.length) } },
      $inc: { turnCount: 1 },
    },
  )

  await db.collection('users').updateOne(
    { _id: _userId },
    { $set: { 'stats.mana': newMana, updatedAt: new Date() } }
  )

  return {
    ok: true,
    cell,
    position: newPos,
    turnCount: (run.turnCount || 1) + 1,
    playerMana: newMana,
    remainingTurns: turnSpend.remainingTurns,
  }
}

/**
 * Begin combat on the current cell (must be monster/mini_boss/big_boss).
 */
export async function startCombat(db, userId) {
  const _userId = toObjectId(userId)
  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }
  if (run.combatState) return { ok: false, reason: 'Combat already in progress' }

  const { r, c } = run.currentPos
  const cellType = run.grid[r][c]
  if (!['monster', 'mini_boss', 'big_boss'].includes(cellType)) {
    return { ok: false, reason: 'No monster on this cell' }
  }

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  // Fetch player stats
  const user = await db.collection('users').findOne({ _id: _userId })
  if (!user) return { ok: false, reason: 'User not found' }
  await repairPlayerStats(db, user)

  const monsterLevel = getMonsterLevel(cellType, run.currentFloor, run.playerLevel, DUNGEON.BOSS_LEVEL_BONUS)
  const template = await getMonsterTemplate(db, cellType)
  const scaled = scaleMonsterStats(template.baseStats, monsterLevel)

  const combatState = {
    monsterName:    template.name,
    monsterLevel,
    monsterHp:      scaled.hp,
    monsterMaxHp:   scaled.hp,
    monsterAd:      scaled.ad,
    monsterAp:      scaled.ap,
    monsterArmor:   scaled.armor,
    monsterMr:      scaled.mr,
    monsterAtkSpeed: scaled.atkSpeed,
    goldReward:     template.goldReward + (run.currentFloor * 5),
    expReward:      template.expReward  + (run.currentFloor * 8),
    cellType,
    playerHp:       user.stats?.hp ?? 100,
    playerMaxHp:    user.stats?.maxHp ?? 100,
    playerMana:     Number(user.stats?.mana ?? 50),
    playerMaxMana:  Number(user.stats?.maxMana ?? 50),
    playerStatus:   null, // 'defend' | 'dodge' | null (active for next monster attack)
    turn:           1,
    log:            [],
  }

  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    { $set: { combatState, updatedAt: new Date() } },
  )

  return { ok: true, combatState, remainingTurns: turnSpend.remainingTurns }
}

/**
 * Execute one combat turn.
 * action: 'attack' | 'heavy_attack' | 'heal' | 'rest' | 'flee' | 'use_item'
 * itemId: ObjectId of user_item for 'use_item' action
 */
export async function combatAction(db, userId, action, itemId = null) {
  const _userId = toObjectId(userId)
  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }
  if (!run.combatState) return { ok: false, reason: 'No combat in progress. Call /combat/start first' }

  const user = await db.collection('users').findOne(
    { _id: _userId },
    { projection: { stats: 1, gold: 1, class: 1 } },
  )
  if (!user) return { ok: false, reason: 'User not found' }
  await repairPlayerStats(db, user)

  let cs = { ...run.combatState }
  // Fix ongoing combatState if it has 0 maxMana
  if (cs.playerMaxMana <= 0 && user.stats.maxMana > 0) {
    cs.playerMaxMana = user.stats.maxMana
    if (cs.playerMana <= 0) cs.playerMana = user.stats.maxMana
  }
  cs.log = [...(cs.log ?? [])]

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  // ── Class-based Mana Costs ─────────────────────────────────────
  const playerClass = user.class || 'warrior'
  const classManaCosts = {
    warrior: { attack: 0, heavy_attack: 0, heal: 0, rest: 0 },
    rogue:   { attack: 2, heavy_attack: 8,  heal: 5, rest: -8 },
    mage:    { attack: 8, heavy_attack: 20, heal: 15, rest: -20 },
  }
  const manaCostsForClass = classManaCosts[playerClass] || classManaCosts.warrior
  const cost = manaCostsForClass[action] || 0

  const currentMana = user.stats?.mana ?? 50
  if (action !== 'flee' && cost > 0 && currentMana < cost) {
    return { ok: false, reason: `Insufficient Mana (${cost} MP required). Your current Mana is ${currentMana}.` }
  }

  // ── Flee ───────────────────────────────────────────────────
  if (action === 'flee') {
    await db.collection('dungeon_runs').updateOne(
      { _id: run._id },
      { $set: { combatState: null, updatedAt: new Date() } },
    )
    return { ok: true, outcome: 'fled', combatState: null, remainingTurns: turnSpend.remainingTurns }
  }

  // ── Use Item ────────────────────────────────────────────────
  if (action === 'use_item') {
    if (!itemId) {
      return { ok: false, reason: 'No item selected' }
    }
    const _itemId = toObjectId(itemId)

    // Fetch user_item and item details
    const userItem = await db.collection('user_items').findOne({
      _id: _itemId,
      userId: _userId,
    })
    if (!userItem) {
      return { ok: false, reason: 'Item not found in inventory' }
    }

    const item = await db.collection('items').findOne({ _id: userItem.itemId })
    if (!item || !['potion', 'scroll'].includes(item.type)) {
      return { ok: false, reason: 'This item cannot be used in combat' }
    }

    // Apply item effects
    let healAmount = 0
    let manaRestored = 0

    if (item.type === 'potion') {
      // Potions: heal based on statBonuses
      healAmount = item.statBonuses?.hp || 20
      manaRestored = item.statBonuses?.mana || 0
    } else if (item.type === 'scroll') {
      // Scrolls: mainly restore mana and give small heal
      manaRestored = item.statBonuses?.mana || 30
      healAmount = item.statBonuses?.hp || 5
    }

    cs.playerHp = Math.min(cs.playerMaxHp, cs.playerHp + healAmount)
    cs.playerMana = Math.min(cs.playerMaxMana, cs.playerMana + manaRestored)

    const turnLog = {
      turn: cs.turn,
      action: 'use_item',
      itemName: item.name,
      heal: healAmount,
      manaRestored: manaRestored,
      playerDmg: 0,
      monsterDmg: 0,
      outcome: 'ongoing'
    }

    // Consume item (reduce quantity)
    if (userItem.quantity > 1) {
      await db.collection('user_items').updateOne(
        { _id: _itemId },
        { $inc: { quantity: -1 } }
      )
    } else {
      // Delete if quantity reaches 0
      await db.collection('user_items').deleteOne({ _id: _itemId })
    }

    // Update user stats
    await db.collection('users').updateOne(
      { _id: _userId },
      {
        $set: {
          'stats.hp': cs.playerHp,
          'stats.mana': cs.playerMana,
          updatedAt: new Date()
        }
      }
    )

    cs.log.push(turnLog)
    cs.turn += 1

    await db.collection('dungeon_runs').updateOne(
      { _id: run._id },
      { $set: { combatState: cs, updatedAt: new Date() } },
    )

    return {
      ok: true,
      outcome: 'ongoing',
      combatState: cs,
      log: cs.log,
      remainingTurns: turnSpend.remainingTurns,
    }
  }
  const playerAd    = user.stats?.ad    ?? 10
  const playerArmor = user.stats?.armor ?? 5
  const critRate   = user.stats?.critRate  ?? 0
  const critDmg    = user.stats?.critDamage ?? 0
  const dodgeRate  = user.stats?.dodgeRate  ?? 0.05

  // Deduct/Restore Mana (with class-based passive regen for Mage)
  const currentManaForDeduction = user.stats?.mana ?? 50
  const maxMana = user.stats?.maxMana ?? 50
  const isMage = playerClass === 'mage'

  // Mages gain passive mana regen during combat (2 per turn)
  const passiveManaRegen = isMage ? 2 : 0

  // action === 'rest' consumes negative mana (restores mana)
  // Others consume their class cost and get passive regen for Mage
  const manaChange = -cost + passiveManaRegen
  const finalNewMana = Math.max(0, currentManaForDeduction + manaChange)
  const cappedNewMana = Math.min(maxMana, finalNewMana)

  if (true) { // Always update mana
    await db.collection('users').updateOne(
        { _id: _userId },
        { $set: { 'stats.mana': cappedNewMana, updatedAt: new Date() } }
    )
    cs.playerMana = Number(cappedNewMana)
  }

  // Player action
  let dmgToMonster = 0
  let isCrit = false
  const turnLog = { turn: cs.turn, action, playerDmg: 0, isCrit: false, monsterDmg: 0, dodged: false }

  if (action === 'rest') {
    turnLog.playerDmg = 0
    turnLog.action = 'rest'
  } else if (action === 'defend') {
    // Warrior ability: reduce incoming damage by 50% for next turn
    cs.playerStatus = 'defend'
    turnLog.playerDmg = 0
    turnLog.action = 'defend'
  } else if (action === 'dodge') {
    // Rogue ability: increase dodge chance for next turn
    cs.playerStatus = 'dodge'
    turnLog.playerDmg = 0
    turnLog.action = 'dodge'
  } else if (action === 'spell') {
    // Mage ability: heal 25% HP
    const healAmount = Math.max(10, Math.floor(cs.playerMaxHp * 0.25))
    cs.playerHp = Math.min(cs.playerMaxHp, cs.playerHp + healAmount)
    turnLog.playerDmg = 0
    turnLog.heal = healAmount
    turnLog.action = 'spell'
  } else if (action === 'heal') {
    const healAmount = Math.max(8, Math.floor(cs.playerMaxHp * 0.2))
    cs.playerHp = Math.min(cs.playerMaxHp, cs.playerHp + healAmount)
    turnLog.playerDmg = 0
    turnLog.heal = healAmount
    turnLog.action = 'heal'
  } else {
    // Attack
    isCrit  = Math.random() < critRate
    const adMult  = action === 'heavy_attack' ? 1.5 : 1.0
    const baseDmg = Math.max(1, Math.floor(playerAd * adMult) - cs.monsterArmor)
    dmgToMonster = Math.round(isCrit ? baseDmg * (1 + critDmg) : baseDmg)
    cs.monsterHp -= dmgToMonster
    turnLog.playerDmg = dmgToMonster
    turnLog.isCrit = isCrit
    turnLog.action = action
  }

  if (cs.monsterHp <= 0) {
    // ── Monster dead ─────────────────────────────────────────
    cs.monsterHp = 0
    turnLog.outcome = 'monster_defeated'
    cs.log.push(turnLog)

    // Mark cell cleared or spawn exit if boss
    const grid = run.grid.map(row => [...row])
    if (['mini_boss', 'big_boss'].includes(cs.cellType)) {
      grid[run.currentPos.r][run.currentPos.c] = 'exit'
    } else {
      grid[run.currentPos.r][run.currentPos.c] = 'cleared'
    }

    // Determine loot
    let lootItem = null
    if (['mini_boss', 'big_boss'].includes(cs.cellType)) {
      // Boss always drops something
      const rarity = rollChest()
      const item = await db.collection('items').findOne({ rarity })
      if (item) {
        const uiDoc = createUserItemDocument({ userId: _userId, itemId: item._id })
        const { insertedId } = await db.collection('user_items').insertOne(uiDoc)
        lootItem = { _id: insertedId, ...uiDoc, item }
      }
    }

    // Give rewards
    await addResources(db, userId, { gold: cs.goldReward, exp: 0 })
    const lvResult = await addExpAndLevelUp(db, userId, cs.expReward)

    // Restore player HP to run snapshot (combat over)
    const updatedHp = Math.min(cs.playerHp + Math.floor(cs.playerMaxHp * 0.10), cs.playerMaxHp)

    const maxSlots = getMaxBackpackSlots(user)
    const canLoot = (run.lootCollected?.length ?? 0) < maxSlots

    await db.collection('dungeon_runs').updateOne(
      { _id: run._id },
      {
        $set: {
          grid,
          combatState: null,
          updatedAt: new Date(),
        },
        $inc: { monstersDefeated: 1, goldEarned: cs.goldReward, expEarned: cs.expReward },
        $push: { lootCollected: (lootItem && canLoot) ? lootItem._id : null },
      },
    )

    // Restore HP in user doc (minor regen after fight)
    await db.collection('users').updateOne(
      { _id: _userId },
      { $set: { 'stats.hp': updatedHp, updatedAt: new Date() } },
    )

    return {
      ok: true,
      outcome: 'victory',
      goldEarned: cs.goldReward,
      expEarned: cs.expReward,
      levelUp: lvResult,
      lootItem,
      log: cs.log,
      remainingTurns: turnSpend.remainingTurns,
    }
  }

  // Monster still alive – counter-attacks player
  // Apply status effects from player's previous action
  let actualDodgeRate = dodgeRate
  if (cs.playerStatus === 'dodge') {
    actualDodgeRate = Math.min(0.99, dodgeRate + 0.60) // Rogue dodge: +60% dodge chance
  }

  const dodged = Math.random() < actualDodgeRate
  if (!dodged) {
    let dmgToPlayer = Math.max(1, cs.monsterAd - playerArmor)

    // Warrior defend: reduce damage by 50%
    if (cs.playerStatus === 'defend') {
      dmgToPlayer = Math.floor(dmgToPlayer * 0.5)
      turnLog.defendActive = true
    }

    cs.playerHp -= dmgToPlayer
    turnLog.monsterDmg = dmgToPlayer
    turnLog.dodged = false
  } else {
    turnLog.dodged = true
  }

  // Clear status effect after applying it
  cs.playerStatus = null

  if (cs.playerHp <= 0) {
    // ── Player dead ───────────────────────────────────────────
    cs.playerHp = 0
    turnLog.outcome = 'player_defeated'
    cs.log.push(turnLog)

    const goldLost = await applyDeathPenalty(db, userId)

    // Delete the run record on defeat to save space
    await db.collection('dungeon_runs').deleteOne({ _id: run._id })

    // Reset user HP to 1
    await db.collection('users').updateOne(
      { _id: _userId },
      { $set: { 'stats.hp': 1, updatedAt: new Date() } },
    )

    return {
      ok: true,
      outcome: 'defeat',
      goldLost,
      log: cs.log,
      remainingTurns: turnSpend.remainingTurns,
    }
  }

  // ── Both alive – save combat state ───────────────────────────
  cs.turn += 1
  turnLog.outcome = 'ongoing'
  cs.log.push(turnLog)

  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    { $set: { combatState: cs, updatedAt: new Date() } },
  )

  return {
    ok: true,
    outcome: 'ongoing',
    combatState: cs,
    log: cs.log,
    remainingTurns: turnSpend.remainingTurns,
  }
}

/**
 * Open a chest on the current cell.
 */
export async function openChest(db, userId) {
  const _userId = toObjectId(userId)
  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }

  const { r, c } = run.currentPos
  if (run.grid[r][c] !== 'chest') return { ok: false, reason: 'No chest on this cell' }

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  const user = await db.collection('users').findOne({ _id: _userId })
  const maxSlots = getMaxBackpackSlots(user)
  const currentLootCount = run.lootCollected?.length ?? 0

  if (currentLootCount >= maxSlots) {
    return { ok: false, reason: `Your backpack is full! (${currentLootCount}/${maxSlots} slots used). Clean it out or upgrade your subscription.` }
  }

  // Roll what type of reward
  const reward = rollChestReward(run.currentFloor)
  let goldEarned = 0
  let ticketsEarned = 0
  let lootItem = null

  if (reward.rewardType === 'gold') {
    goldEarned = reward.amount
    await db.collection('users').updateOne(
      { _id: _userId },
      { $inc: { gold: goldEarned }, $set: { updatedAt: new Date() } }
    )
  } else if (reward.rewardType === 'ticket') {
    ticketsEarned = reward.amount
    await db.collection('users').updateOne(
      { _id: _userId },
      { $inc: { ticketCount: ticketsEarned }, $set: { updatedAt: new Date() } }
    )
  } else if (reward.rewardType === 'item') {
    // Item reward
    const pipeline = [
      { $match: { type: reward.itemPool.type, rarity: { $in: reward.itemPool.rarities } } },
      { $sample: { size: 1 } }
    ]
    const [item] = await db.collection('items').aggregate(pipeline).toArray()

    if (item) {
      const uiDoc = createUserItemDocument({ userId: _userId, itemId: item._id })
      const { insertedId } = await db.collection('user_items').insertOne(uiDoc)
      lootItem = { _id: insertedId, ...uiDoc, item }
    }
  }

  // Clear the chest cell
  const grid = run.grid.map(row => [...row])
  grid[r][c] = 'cleared'

  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    {
      $set: { grid, updatedAt: new Date() },
      $push: { lootCollected: lootItem?._id ?? null },
    },
  )

  return {
    ok: true,
    rewardType: reward.rewardType,
    goldEarned,
    ticketsEarned,
    lootItem,
    remainingTurns: turnSpend.remainingTurns,
  }
}

/**
 * Get shop inventory (3 random items for sale).
 */
export async function visitShop(db, userId) {
  const _userId = toObjectId(userId)
  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }

  const { r, c } = run.currentPos
  if (run.grid[r][c] !== 'shop') return { ok: false, reason: 'No shop on this cell' }

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  const items = await db.collection('items')
    .aggregate([{ $sample: { size: 3 } }])
    .toArray()

  return { ok: true, shopItems: items, remainingTurns: turnSpend.remainingTurns }
}

/**
 * Advance to the next floor (must be standing on 'exit' cell with no active combat).
 */
export async function nextFloor(db, userId) {
  const _userId = toObjectId(userId)
  const run = await db.collection('dungeon_runs').findOne({ userId: _userId, status: 'active' })
  if (!run) return { ok: false, reason: 'No active dungeon run' }
  if (run.combatState) return { ok: false, reason: 'Finish combat before advancing' }

  const { r, c } = run.currentPos
  if (run.grid[r][c] !== 'exit') return { ok: false, reason: 'You must be on the exit cell to advance' }

  const turnSpend = await spendTurns(db, userId, 1)
  if (!turnSpend.ok) return turnSpend

  const nextFloorNum = run.currentFloor + 1

  if (nextFloorNum > DUNGEON.TOTAL_FLOORS) {
    // All floors complete → delete run record to save space
    await db.collection('dungeon_runs').deleteOne({ _id: run._id })
    return { ok: true, completed: true, message: 'Dungeon complete! Congratulations!', remainingTurns: turnSpend.remainingTurns }
  }

  const plDoc = await getOrCreatePlayerLevel(db, userId)
  const { grid: newGrid, startPos } = generateGrid(nextFloorNum, plDoc.level, run.gridSize)

  await db.collection('dungeon_runs').updateOne(
    { _id: run._id },
    {
      $set: {
        currentFloor: nextFloorNum,
        grid: newGrid,
        currentPos: startPos,
        visitedCells: getVisibleCells(startPos.r, startPos.c, run.gridSize),
        combatState: null,
        updatedAt: new Date(),
      },
    },
  )

  // Full restore Mana on floor advance
  const user = await db.collection('users').findOne({ _id: _userId }, { projection: { 'stats.maxMana': 1 } })
  await db.collection('users').updateOne(
    { _id: _userId },
    { $set: { 'stats.mana': user.stats?.maxMana ?? 50, updatedAt: new Date() } }
  )

  return { ok: true, completed: false, currentFloor: nextFloorNum, grid: newGrid, startPos, remainingTurns: turnSpend.remainingTurns }
}

/**
 * End (abandon / force-complete) the active run.
 */
export async function endDungeonRun(db, userId) {
  const _userId = toObjectId(userId)
  // Delete the run record on abandonment to save space
  await db.collection('dungeon_runs').deleteOne({ userId: _userId, status: 'active' })

  // Full restore HP and Mana upon abandonment
  const user = await db.collection('users').findOne({ _id: _userId })
  if (user && user.stats) {
    await db.collection('users').updateOne(
      { _id: _userId },
      { 
        $set: { 
          'stats.hp': user.stats.maxHp ?? 100,
          'stats.mana': user.stats.maxMana ?? 50,
          updatedAt: new Date() 
        } 
      }
    )
  }

  return { ok: true }
}
