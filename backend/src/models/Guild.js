/**
 * guilds collection schema
 */

export function createGuildDocument({ name, leaderId }) {
  const now = new Date()
  return {
    name,
    leaderId,       // ObjectId → users
    members: [
      { userId: leaderId, role: 'leader', joinedAt: now },
    ],
    guildBossLevel: 1,
    guildCoinBank: 0,
    // Marketplace listings: stored in separate guild_listings collection
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * guild_listings collection schema
 * Created when a guild member lists an item for sale.
 */
export function createGuildListingDocument({ sellerId, guildId, userItemId, price, quantity = 1 }) {
  return {
    sellerId,    // ObjectId → users
    guildId,     // ObjectId → guilds
    userItemId,  // ObjectId → user_items
    price,       // in guild coins
    quantity,
    status: 'active',  // 'active' | 'sold' | 'cancelled'
    createdAt: new Date(),
  }
}

export const guildIndexes = [
  { key: { name: 1 }, options: { unique: true } },
  { key: { 'members.userId': 1 } },
]

export const guildListingIndexes = [
  { key: { guildId: 1, status: 1 } },
  { key: { sellerId: 1 } },
]
