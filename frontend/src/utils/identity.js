export function getIdentityTitle(level = 1) {
  const lv = Number(level) || 1;
  if (lv >= 50) return 'SS Rank Hunter';
  if (lv >= 31) return 'Boss Killer';
  if (lv >= 21) return 'Dungeon Slayer';
  if (lv >= 11) return 'Explorer';
  return 'Novice';
}

export function getNameRarity(title) {
  if (title === 'SS Rank Hunter') return 'ss';
  if (title === 'Boss Killer') return 'legendary';
  if (title === 'Dungeon Slayer') return 'epic';
  if (title === 'Explorer') return 'rare';
  return 'common';
}

export function getRarityTextClass(rarity) {
  switch (rarity) {
    case 'rare':
      return 'text-blue-400';
    case 'epic':
      return 'text-purple-400';
    case 'legendary':
      return 'text-yellow-300';
    case 'ss':
      return 'text-red-400';
    default:
      return 'text-stone-200';
  }
}

