// ============================================================
//  QUESTLY – Game Constants
//  All sensitive values (URIs, secrets) come from c.env, NOT here.
// ============================================================

export const DB_NAME = 'questly-db'

// ---- Subscription tiers ----
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  MONTHLY: 'monthly',
  SIX_MONTHS: '6months',
  YEARLY: 'yearly',
}

// ---- Daily limits ----
export const DAILY_LIMITS = {
  APTITUDE_TESTS_FREE: 4,
  APTITUDE_TESTS_PREMIUM: 8,
  FREE_CHEST_ADS: 3,          // ad-supported free chests per day
}

// ---- Backpack slots ----
export const BACKPACK_SLOTS = {
  BASE: 5,
  VIP_BONUS: 5,
}

// ---- Aptitude Test rewards ----
export const APTITUDE_REWARDS = {
  PASS_THRESHOLD: 50,           // % correct to "pass"
  PASS_MOVES: 5,                // moves awarded on pass
  MOVES_PER_EXTRA_PERCENT: 1,   // +1 move per % above 50
  PASS_GOLD: 3,                 // G awarded on pass
  GOLD_PER_10_PERCENT: 2,       // extra G for every 10 % above 50
  // Ticket system (per question, multi-choice mode)
  TICKET_TIER_1_MAX_PCT: 5,     // 0-5 % → 1 ticket
  TICKET_TIER_1_REWARD: 1,
  TICKET_TIER_2_MIN_PCT: 6,     // 6-9 % → 3 tickets
  TICKET_TIER_2_MAX_PCT: 9,
  TICKET_TIER_2_REWARD: 3,
  TICKETS_PER_MOVE: 6,          // 6 tickets = 1 dungeon move
}

// ---- Dungeon ----
export const DUNGEON = {
  GRID_SIZE: 5,                // 5×5
  BOSS_FLOOR: 5,               // big boss spawns here
}

// ---- Equipment rarities ----
export const RARITY = {
  E: 'E',
  D: 'D',
  C: 'C',
  B: 'B',
  A: 'A',
  S: 'S',
  SS: 'SS',
}

// ---- Item types ----
export const ITEM_TYPE = {
  EQUIPMENT: 'equipment',
  POTION: 'potion',
  MATERIAL: 'material',
  SEED: 'seed',
  SCROLL: 'scroll',
}

// ---- Equipment slots ----
export const EQUIP_SLOT = {
  HEAD: 'head',
  BODY: 'body',
  LEGS: 'legs',
  FEET: 'feet',
  WEAPON: 'weapon',
  OFFHAND: 'offhand',
  RING: 'ring',
}

// ---- Class identifiers ----
export const CLASS = {
  WARRIOR: 'warrior',
  ROGUE: 'rogue',
  MAGE: 'mage',
}

// ---- Gacha chest ----
export const CHEST_RATES = {
  SCROLL: 0.03,       // 3 % scroll drop
  LEGENDARY: 0.07,    // 7 % S/SS gear
  RARE: 0.20,         // 20 % A gear
  COMMON: 0.70,       // 70 % E-B gear
}

// ---- Monster tiers ----
export const MONSTER_TIER = {
  MINION: 'minion',
  MINI_BOSS: 'mini_boss',
  BIG_BOSS: 'big_boss',
}
