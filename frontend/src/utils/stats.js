export const CORE_STAT_ORDER = ['hp', 'mp', 'ad', 'ap', 'armor', 'mr'];

export const CORE_STAT_LABEL = {
  hp: 'HP',
  mp: 'MP',
  ad: 'AD',
  ap: 'AP',
  armor: 'ARMOR',
  mr: 'MR',
};

export const CLASS_BASE_STATS = {
  warrior: { hp: 120, mp: 10, ad: 12, ap: 0, armor: 10, mr: 5 },
  rogue: { hp: 90, mp: 20, ad: 14, ap: 0, armor: 4, mr: 3 },
  mage: { hp: 80, mp: 50, ad: 5, ap: 15, armor: 3, mr: 8 },
};

export const CLASS_LEVEL_GROWTH = {
  warrior: { hp: 12, mp: 0, ad: 2, ap: 0, armor: 2, mr: 1 },
  rogue: { hp: 8, mp: 0, ad: 3, ap: 0, armor: 1, mr: 1 },
  mage: { hp: 7, mp: 10, ad: 0, ap: 4, armor: 0, mr: 1 },
};

export function computeClassScaledStats(cls, level) {
  const base = CLASS_BASE_STATS[cls] ?? CLASS_BASE_STATS.warrior;
  const growth = CLASS_LEVEL_GROWTH[cls] ?? CLASS_LEVEL_GROWTH.warrior;
  const levelUps = Math.max(0, (level ?? 1) - 1);
  return {
    hp: base.hp + growth.hp * levelUps,
    mp: base.mp + growth.mp * levelUps,
    ad: base.ad + growth.ad * levelUps,
    ap: base.ap + growth.ap * levelUps,
    armor: base.armor + growth.armor * levelUps,
    mr: base.mr + growth.mr * levelUps,
  };
}

export function normalizeItemBonuses(statBonuses = {}) {
  return {
    hp: (statBonuses.hp ?? 0) + (statBonuses.maxHp ?? 0),
    mp: (statBonuses.mp ?? 0) + (statBonuses.mana ?? 0) + (statBonuses.maxMana ?? 0),
    ad: (statBonuses.ad ?? 0) + (statBonuses.atk ?? 0),
    ap: (statBonuses.ap ?? 0) + (statBonuses.spellDamage ?? 0),
    armor: (statBonuses.armor ?? 0) + (statBonuses.def ?? 0),
    mr: statBonuses.mr ?? 0,
  };
}

export function mergeCoreStats(base, bonus) {
  const merged = {};
  for (const key of CORE_STAT_ORDER) {
    merged[key] = (base?.[key] ?? 0) + (bonus?.[key] ?? 0);
  }
  return merged;
}

export function formatBonusLines(statBonuses = {}, maxLines = 4) {
  const normalized = normalizeItemBonuses(statBonuses);
  return CORE_STAT_ORDER
    .filter((k) => normalized[k] !== 0)
    .slice(0, maxLines)
    .map((k) => `${normalized[k] > 0 ? '+' : ''}${normalized[k]} ${CORE_STAT_LABEL[k]}`);
}

export function getEquippedBonusFromInventory(inventory = []) {
  return inventory.reduce((acc, entry) => {
    if (!entry?.isEquipped) return acc;
    const bonus = normalizeItemBonuses(entry.item?.statBonuses ?? {});
    return {
      hp: acc.hp + bonus.hp,
      mp: acc.mp + bonus.mp,
      ad: acc.ad + bonus.ad,
      ap: acc.ap + bonus.ap,
      armor: acc.armor + bonus.armor,
      mr: acc.mr + bonus.mr,
    };
  }, { hp: 0, mp: 0, ad: 0, ap: 0, armor: 0, mr: 0 });
}
