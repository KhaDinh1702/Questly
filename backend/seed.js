/**
 * seed.js  –  Questly shop item seeder
 * Run from backend directory:
 *   node seed.js
 *
 * Requires:  MONGODB_URI in .env  (or set in process.env)
 * Effect:    Drops the `items` collection, then inserts the full catalog.
 */

import 'dotenv/config'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set in .env')
  process.exit(1)
}

// ── Enums (mirrors src/config/constants.js) ──────────────────────────────────
const RARITY = { E: 'E', D: 'D', C: 'C', B: 'B', A: 'A', S: 'S', SS: 'SS' }
const ITEM_TYPE = { EQUIPMENT: 'equipment', POTION: 'potion', MATERIAL: 'material', SCROLL: 'scroll' }
const EQUIP_SLOT = { HEAD: 'head', BODY: 'body', LEGS: 'legs', FEET: 'feet', WEAPON: 'weapon', OFFHAND: 'offhand', RING: 'ring' }
const CLASS = { WARRIOR: 'warrior', ROGUE: 'rogue', MAGE: 'mage', ALL: 'all' }

// ── Helper ────────────────────────────────────────────────────────────────────
function item({
  name, description = '', type, reqClass = CLASS.ALL,
  rarity = RARITY.E, equipSlot = null, statBonuses = {},
  price = 0, sellPrice = 0, stackable = false,
  lootTableWeight = 1.0, specialTag = null, imageUrl = null
}) {
  return {
    name, description, type, reqClass, rarity, equipSlot,
    statBonuses: {
      hp: 0, maxHp: 0, mana: 0, maxMana: 0,
      atk: 0, def: 0, atkSpeed: 0, dodgeRate: 0,
      critRate: 0, critDamage: 0, lifesteal: 0,
      counterRate: 0, hpRegen: 0, manaRegen: 0, spellDamage: 0,
      ...statBonuses,
    },
    price, sellPrice, stackable, lootTableWeight,
    specialTag: specialTag ?? null,   // 'daily_mythic' | 'daily_legendary' | 'gacha' | null
    imageUrl: imageUrl,
    createdAt: new Date(),
  }
}

// ── Catalog ───────────────────────────────────────────────────────────────────
const ITEMS = [
  // ── Daily Limited – Mythic SS ──────────────────────────────────────────────
  item({
    name: "Dragon's Heart Potion",
    description: '+25% Critical Damage, +15% All Elemental Resists. Passive: Draconic Resolve (Indestructible).',
    type: ITEM_TYPE.POTION, reqClass: CLASS.ALL, rarity: RARITY.SS,
    statBonuses: { hp: 35, def: 4, mr: 4, critDamage: 12 },
    price: 45000, sellPrice: 20000, stackable: false,
    lootTableWeight: 0.1, specialTag: 'daily_mythic',
    imageUrl: '/items/Dragon_Heart_Potion.png'
  }),

  // ── Daily Limited – Legendary S ───────────────────────────────────────────
  item({
    name: 'Sun-Forged Blade',
    description: '+420 Physical Attack, +10 ATK Speed (Solar Grace). Skill: Solar Flare (AoE Burn).',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.WARRIOR, rarity: RARITY.S,
    equipSlot: EQUIP_SLOT.WEAPON,
    statBonuses: { atk: 10, def: 2, hp: 8 },
    price: 18500, sellPrice: 8000,
    lootTableWeight: 0.4, specialTag: 'daily_legendary',
  }),

  // ── Regular Shop Items ─────────────────────────────────────────────────────
  item({
    name: 'Standard Buckler',
    description: '+15% Block Chance, +5 DEF. Durability: 120.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.WARRIOR, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.OFFHAND,
    statBonuses: { def: 4, hp: 5 },
    price: 1200, sellPrice: 400,
  }),
  item({
    name: 'Iron Helmet',
    description: '+10 DEF, +5 Max HP.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ALL, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.HEAD,
    statBonuses: { def: 3, hp: 4 },
    price: 1000, sellPrice: 350,
  }),
  item({
    name: 'Iron Leggings',
    description: '+12 DEF, +8 Max HP.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ALL, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.LEGS,
    statBonuses: { def: 4, hp: 6 },
    price: 1100, sellPrice: 380,
  }),
  item({
    name: 'Iron Boots',
    description: '+8 DEF, +5% Movement Speed.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ALL, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.FEET,
    statBonuses: { def: 2, hp: 3 },
    price: 900, sellPrice: 300,
  }),
  item({
    name: 'Eagle Eye Bow',
    description: '+15% Crit Rate, +12 ATK. Range: +10%.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ROGUE, rarity: RARITY.A,
    equipSlot: EQUIP_SLOT.WEAPON,
    statBonuses: { atk: 7, critRate: 6 },
    price: 4850, sellPrice: 1800,
  }),
  item({
    name: 'Wind Runner Ring',
    description: '+10 ATK Speed, +5 Dodge Rate, +2% Evasion.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ROGUE, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.RING,
    statBonuses: { atk: 3, def: 1 },
    price: 2100, sellPrice: 700,
  }),
  item({
    name: 'Sturdy Leather Boots',
    description: '+3 ATK Speed, +2 DEF. Stamina Regen +1%.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ALL, rarity: RARITY.C,
    equipSlot: EQUIP_SLOT.FEET,
    statBonuses: { def: 2, hp: 4 },
    price: 450, sellPrice: 120,
  }),
  item({
    name: 'Iron War Hammer',
    description: '+28 ATK, -5% ATK Speed. Stun Chance: 5%.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.WARRIOR, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.WEAPON,
    statBonuses: { atk: 8, def: 1 },
    price: 1750, sellPrice: 550,
  }),
  item({
    name: 'Shadow Cloak',
    description: '+20% Dodge Rate, +8 ATK Speed. Passive: Fade.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ROGUE, rarity: RARITY.A,
    equipSlot: EQUIP_SLOT.BODY,
    statBonuses: { atk: 6, def: 1, hp: 4 },
    price: 6200, sellPrice: 2500,
  }),
  item({
    name: 'Healing Salve',
    description: 'Restores 250 HP. Cooldown: 30s.',
    type: ITEM_TYPE.POTION, reqClass: CLASS.ALL, rarity: RARITY.C,
    statBonuses: { hp: 18 },
    price: 300, sellPrice: 80, stackable: true,
    lootTableWeight: 3.0,
  }),
  item({
    name: 'Mana Crystal',
    description: 'Restores 100 Mana. Instant Use.',
    type: ITEM_TYPE.POTION, reqClass: CLASS.MAGE, rarity: RARITY.D,
    statBonuses: { mana: 16 },
    price: 120, sellPrice: 30, stackable: true,
    lootTableWeight: 4.0,
  }),
  item({
    name: "Apprentice's Staff",
    description: '+18 Spell Damage, +10 Max Mana. Passive: Mana Flow.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.MAGE, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.WEAPON,
    statBonuses: { spellDamage: 8, maxMana: 12 },
    price: 2400, sellPrice: 800,
  }),
  item({
    name: 'Arcane Robe',
    description: '+12 Spell Damage, +20 Max Mana. Resist: Magic +5%.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.MAGE, rarity: RARITY.A,
    equipSlot: EQUIP_SLOT.BODY,
    statBonuses: { spellDamage: 7, maxMana: 14, mr: 2 },
    price: 5500, sellPrice: 2000,
  }),
  item({
    name: 'Iron Plate Armor',
    description: '+35 DEF, +20 Max HP. Movement Speed -5%.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.WARRIOR, rarity: RARITY.B,
    equipSlot: EQUIP_SLOT.BODY,
    statBonuses: { def: 6, maxHp: 10 },
    price: 3200, sellPrice: 1100,
  }),
  item({
    name: 'Smoke Bomb',
    description: 'Grants Invisible for 3s. Stackable.',
    type: ITEM_TYPE.POTION, reqClass: CLASS.ROGUE, rarity: RARITY.C,
    statBonuses: {},
    price: 500, sellPrice: 150, stackable: true,
    lootTableWeight: 2.0,
  }),
  item({
    name: 'Fire Scroll',
    description: 'Unleashes a burst of flame dealing 300% spell damage.',
    type: ITEM_TYPE.SCROLL, reqClass: CLASS.MAGE, rarity: RARITY.A,
    statBonuses: { spellDamage: 6, mana: 6 },
    price: 4000, sellPrice: 1500, stackable: true,
  }),
  item({
    name: 'Ancient Wisdom Scroll',
    description: 'Unlocks forbidden knowledge. Grants +50 Max Mana and +20 Spell Damage permanently.',
    type: ITEM_TYPE.SCROLL, reqClass: CLASS.ALL, rarity: RARITY.S,
    statBonuses: { maxMana: 50, spellDamage: 20 },
    price: 15000, sellPrice: 5000, stackable: true,
  }),
  item({
    name: 'Twin Daggers',
    description: '+22 ATK, +15% Crit Rate. Dual-wield weapon.',
    type: ITEM_TYPE.EQUIPMENT, reqClass: CLASS.ROGUE, rarity: RARITY.A,
    equipSlot: EQUIP_SLOT.WEAPON,
    statBonuses: { atk: 8, critRate: 8 },
    price: 5000, sellPrice: 1900,
  }),
  item({
    name: 'Health Tonic',
    description: 'Restores 100 HP over 10s.',
    type: ITEM_TYPE.POTION, reqClass: CLASS.ALL, rarity: RARITY.E,
    statBonuses: { hpRegen: 10 },
    price: 80, sellPrice: 20, stackable: true,
    lootTableWeight: 8.0,
  }),
]

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db('questly-db')
    const col = db.collection('items')

    // Always wipe and re-seed to ensure latest catalog
    console.log('ℹ️   Resetting and seeding items collection...');
    await col.deleteMany({})
    const result = await col.insertMany(ITEMS)
    console.log(`✅  Inserted ${result.insertedCount} items into 'items' collection.`)

    // Ensure indexes
    await col.createIndex({ type: 1, rarity: 1 })
    await col.createIndex({ reqClass: 1 })
    await col.createIndex({ name: 'text' })
    console.log('✅  Indexes ensured.')
  } finally {
    await client.close()
  }
}

seed().catch((e) => { console.error('❌  Seed failed:', e.message); process.exit(1) })
