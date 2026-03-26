/**
 * items collection schema
 * Master catalog of all items in the game.
 */

import { ITEM_TYPE, EQUIP_SLOT, CLASS, RARITY } from '../config/constants.js'

/**
 * Create a new Item document.
 * All fields are validated in the service layer before insert.
 */
export function createItemDocument({
  name,
  description = '',
  type,               // ITEM_TYPE.*
  reqClass = 'all',   // CLASS.* | 'all'
  rarity = RARITY.E,
  equipSlot = null,   // EQUIP_SLOT.* or null for non-equipment
  statBonuses = {},
  price = 0,          // shop buy price in gold
  sellPrice = 0,
  stackable = false,  // potions, seeds, materials
  imageUrl = null,
  lootTableWeight = 1.0,  // relative chance in monster drops / gacha pool
}) {
  return {
    name,
    description,
    type,
    reqClass,
    rarity,
    equipSlot,
    statBonuses: {
      hp:          statBonuses.hp          ?? 0,
      maxHp:       statBonuses.maxHp       ?? 0,
      mana:        statBonuses.mana        ?? 0,
      maxMana:     statBonuses.maxMana     ?? 0,
      atk:         statBonuses.atk         ?? 0,
      def:         statBonuses.def         ?? 0,
      atkSpeed:    statBonuses.atkSpeed    ?? 0,
      dodgeRate:   statBonuses.dodgeRate   ?? 0,
      critRate:    statBonuses.critRate    ?? 0,
      critDamage:  statBonuses.critDamage  ?? 0,
      lifesteal:   statBonuses.lifesteal   ?? 0,
      counterRate: statBonuses.counterRate ?? 0,
      hpRegen:     statBonuses.hpRegen     ?? 0,
      manaRegen:   statBonuses.manaRegen   ?? 0,
      spellDamage: statBonuses.spellDamage ?? 0,
    },
    price,
    sellPrice,
    stackable,
    imageUrl,
    lootTableWeight,
    createdAt: new Date(),
  }
}

export const itemIndexes = [
  { key: { type: 1, rarity: 1 } },
  { key: { reqClass: 1 } },
  { key: { name: 'text' } },   // text search
]
