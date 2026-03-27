import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { shopApi, userApi } from '../../services/api';
import { formatBonusLines } from '../../utils/stats';

/* ── shadow helpers ───────────────────────────────────────────────────────── */
const pixelBorderMythic = { boxShadow: '0 -4px 0 0 #7a5907, 0 4px 0 0 #7a5907, -4px 0 0 0 #7a5907, 4px 0 0 0 #7a5907' };
const pixelBorderLegendary = { boxShadow: '0 -4px 0 0 #c29947, 0 4px 0 0 #c29947, -4px 0 0 0 #c29947, 4px 0 0 0 #c29947' };
const carvedBevel = { boxShadow: 'inset 2px 2px 0px 0px #ffdea5, inset -2px -2px 0px 0px #483200' };
const stoneBevel = { boxShadow: 'inset 2px 2px 0px 0px #c7c6c6, inset -2px -2px 0px 0px #1b1c1c' };
const gachaBorder = { boxShadow: '0 -4px 0 0 #483200, 0 4px 0 0 #483200, -4px 0 0 0 #483200, 4px 0 0 0 #483200, inset 4px 4px 0 0 #c29947' };

/* ── constants ────────────────────────────────────────────────────────────── */
const DROP_RATES = [
  { label: 'Tier SS – Mythic', rate: '0.1%', hi: true },
  { label: 'Tier S – Legendary', rate: '0.4%', hi: true },
  { label: 'Tier A – Epic', rate: '2.5%', hi: false },
  { label: 'Tier B – Rare', rate: '7%', hi: false },
  { label: 'Tier C – Uncommon', rate: '15%', hi: false },
  { label: 'Tier D – Weak', rate: '25%', hi: false },
  { label: 'Tier E – Common', rate: '50%', hi: false },
];

const ITEM_TYPES = [
  { label: 'Equipment', value: 'equipment' },
  { label: 'Potion', value: 'potion' },
  { label: 'Material', value: 'material' },
  { label: 'Scroll', value: 'scroll' },
];

const CLASSES = [
  { label: 'Warrior', value: 'warrior', icon: 'swords' },
  { label: 'Rogue', value: 'rogue', icon: 'sprint' },
  { label: 'Mage', value: 'mage', icon: 'auto_stories' },
];

const RARITIES = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'];

const RARITY_COLOR = {
  E: 'text-stone-500',
  D: 'text-stone-400',
  C: 'text-emerald-600',
  B: 'text-blue-600',
  A: 'text-purple-600',
  S: 'text-amber-600',
  SS: 'text-primary',
};

const RARITY_LABEL = {
  E: 'Common', D: 'Weak', C: 'Uncommon',
  B: 'Rare', A: 'Epic', S: 'Legendary', SS: 'Mythic',
};

const TYPE_ICON = {
  equipment: 'swords',
  potion: 'science',
  material: 'category',
  scroll: 'auto_stories',
};

/* ── countdown ────────────────────────────────────────────────────────────── */
function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    function update() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000)));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(left / 3600)).padStart(2, '0');
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ── main component ───────────────────────────────────────────────────────── */
export default function Shop() {
  /* currency */
  const [gold, setGold] = useState(null);
  const [tickets, setTickets] = useState(null);

  /* filters */
  const [activeClasses, setActiveClasses] = useState(new Set());   // multi-select
  const [activeTypes, setActiveTypes] = useState(new Set());   // multi-select
  const [activeRarity, setActiveRarity] = useState('');          // single

  /* items */
  const [allItems, setAllItems] = useState([]);
  const [dailyMythic, setDailyMythic] = useState(null);
  const [dailyLegend, setDailyLegend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyMsg, setBuyMsg] = useState(null);

  const countdown = useCountdown();

  /* ── fetch user (gold + tickets) ─────────────────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;          // guest – keep null
    userApi.getMe()
      .then((r) => {
        setGold(r.data.gold ?? 0);
        setTickets(r.data.ticketCount ?? 0);
      })
      .catch(() => { });
  }, []);

  /* ── fetch all shop items once ────────────────────────────────────────────── */
  useEffect(() => {
    shopApi.getItems()
      .then((r) => {
        const items = r.data ?? [];
        setDailyMythic(items.find((i) => i.specialTag === 'daily_mythic') ?? null);
        setDailyLegend(items.find((i) => i.specialTag === 'daily_legendary') ?? null);
        setAllItems(items.filter((i) => !i.specialTag));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  /* ── filtered items ───────────────────────────────────────────────────────── */
  const filtered = allItems.filter((item) => {
    const classOk = activeClasses.size === 0
      || activeClasses.has(item.reqClass)
      || item.reqClass === 'all';
    const typeOk = activeTypes.size === 0 || activeTypes.has(item.type);
    const rarityOk = !activeRarity || item.rarity === activeRarity;
    return classOk && typeOk && rarityOk;
  });

  /* ── toggle helpers ───────────────────────────────────────────────────────── */
  function toggleClass(val) {
    setActiveClasses((prev) => {
      const n = new Set(prev);
      n.has(val) ? n.delete(val) : n.add(val);
      return n;
    });
  }
  function toggleType(val) {
    setActiveTypes((prev) => {
      const n = new Set(prev);
      n.has(val) ? n.delete(val) : n.add(val);
      return n;
    });
  }
  function toggleRarity(val) {
    setActiveRarity((prev) => (prev === val ? '' : val));
  }

  /* ── buy ──────────────────────────────────────────────────────────────────── */
  async function handleBuy(item) {
    const token = localStorage.getItem('token');
    if (!token) { setBuyMsg('Login to purchase items.'); return; }

    // Check gold before attempting purchase
    if (gold < item.price) {
      setBuyMsg(`Not enough gold! You need ${(item.price - gold).toLocaleString()} more.`);
      setTimeout(() => setBuyMsg(null), 3000);
      return;
    }

    try {
      const response = await shopApi.buy(item._id, 1);
      setBuyMsg(`✅ Purchased "${item.name}"!`);
      // Update gold from server response
      setGold(response.data.newGoldBalance);
      // Trigger inventory refresh
      localStorage.setItem('armoryInventoryVersion', String(Date.now()));
    } catch (e) {
      const errorMsg = e.response?.data?.error ?? 'Purchase failed.';
      setBuyMsg(`❌ ${errorMsg}`);
      console.error('Buy error:', e);
    }
    setTimeout(() => setBuyMsg(null), 3000);
  }

  /* ── gacha roll ───────────────────────────────────────────────────────────── */
  async function handleRoll() {
    const token = localStorage.getItem('token');
    if (!token) { setBuyMsg('Login to roll the chest.'); return; }

    // Check tickets before attempting roll
    if (tickets < 1) {
      setBuyMsg(`You need at least 1 ticket to roll.`);
      setTimeout(() => setBuyMsg(null), 3000);
      return;
    }

    try {
      const { data } = await shopApi.rollChest();
      const itemName = data.item?.name || 'Unknown Item';
      const tier = data.tierStr || '?';
      setBuyMsg(`Rolled a [Tier ${tier}] ${itemName} ! Check your inventory.`);
      setTickets(data.newTicketBalance);
      localStorage.setItem('armoryInventoryVersion', String(Date.now()));
    } catch (e) {
      const errorMsg = e.response?.data?.error ?? 'Roll failed.';
      setBuyMsg(`❌ ${errorMsg}`);
      console.error('Roll error:', e);
    }
    setTimeout(() => setBuyMsg(null), 4000);
  }

  /* ── render helpers ───────────────────────────────────────────────────────── */
  function statLine(statBonuses) {
    if (!statBonuses) return [];
    return Object.entries(statBonuses)
      .filter(([, v]) => v !== 0)
      .slice(0, 3)
      .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`);
  }

  /* ──────────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="font-body text-on-surface h-screen overflow-hidden flex flex-col selection:bg-primary-container/30"
      style={{
        backgroundImage: "url('/maps/shop.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navbar />

      <div className="flex-grow overflow-y-auto w-full custom-scrollbar">

      {/* toast */}
      {buyMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface px-6 py-3 font-bold shadow-lg text-sm">
          {buyMsg}
        </div>
      )}

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-12">

        {/* ── Gacha Chest ─────────────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <span className="text-secondary font-bold uppercase tracking-widest text-xs">Divine Fortune</span>
            <h2 className="text-4xl font-headline font-bold text-white">Ancient Relic Chest</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 relative bg-surface p-1 min-h-[360px] flex flex-col items-center justify-center overflow-hidden" style={gachaBorder}>
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" }} />
              <div className="relative group cursor-pointer text-center">
                <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full animate-pulse group-hover:bg-primary/40 transition-all pointer-events-none" />
                <span
                  className="relative material-symbols-outlined text-primary block transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                  style={{ fontSize: '140px', fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 20px 50px rgba(122,89,7,0.5))' }}
                >
                  deployed_code
                </span>
                <div className="mt-4 flex flex-col items-center gap-4">
                  <button
                    onClick={handleRoll}
                    className="bg-primary text-on-primary px-10 py-4 font-headline font-black text-xl active:scale-95 transition-all flex items-center gap-3 hover:shadow-[0_0_30px_rgba(122,89,7,0.4)]"
                    style={carvedBevel}
                  >
                    <span className="material-symbols-outlined">confirmation_number</span>
                    ROLL FOR 1 TICKET
                  </button>
                  <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest opacity-60 italic">
                    May the Ancestors favor you
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container p-6 border-2 border-outline/10 flex flex-col">
              <h3 className="text-xl font-headline font-black text-on-surface mb-4 border-b border-primary/20 pb-2">
                Enchanted Drop Probabilities
              </h3>
              <div className="flex-1">
                {DROP_RATES.map((r) => (
                  <div key={r.label} className="flex justify-between items-center py-2 border-b border-outline/5">
                    <span className="font-bold text-sm opacity-70">{r.label}</span>
                    <span className={`font-black ${r.hi ? 'text-primary' : ''}`}>{r.rate}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 bg-primary/5 text-xs italic opacity-80 border-l-2 border-primary">
                *All chests contain at least one item. High-tier items include 2–3 random bonus lines.
              </div>
            </div>
          </div>
        </section>

        {/* ── Daily Limited Goods ─────────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-xs">Timed Offers</span>
              <h2 className="text-4xl font-headline font-bold text-white">Daily Limited Goods</h2>
            </div>
            <div className="bg-error-container text-error px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="font-bold">Resets in {countdown}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mythic */}
            <DailyCard item={dailyMythic} fallbackTier="SS" onBuy={handleBuy} style={pixelBorderMythic}
              badgeClass="bg-primary text-on-primary" accentClass="text-primary"
              btnStyle={carvedBevel} btnClass="bg-primary text-on-primary"
              icon="favorite" iconClass="text-red-400"
            />
            {/* Legendary */}
            <DailyCard item={dailyLegend} fallbackTier="S" onBuy={handleBuy} style={pixelBorderLegendary}
              badgeClass="bg-primary-container text-on-primary-container" accentClass="text-primary-container"
              btnStyle={carvedBevel} btnClass="bg-primary-container text-on-primary-container"
              icon="swords" iconClass="text-amber-300"
            />
          </div>
        </section>

        {/* ── Currency & Filters (Not Fixed) ────────────────────────────────── */}
        <section className="bg-amber-50/90 border-2 border-stone-300 p-6 space-y-6 shadow-md shadow-black/20">
          <div className="flex justify-between items-center border-b border-stone-300 pb-4">
            <h3 className="font-headline font-black text-xl text-yellow-900 uppercase tracking-widest">Shop Navigation</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-primary shadow-[2px_2px_0_0_rgba(122,89,7,0.3)]">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <span className="font-bold text-on-surface">{gold === null ? '—' : `${gold.toLocaleString()} G`}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-secondary shadow-[2px_2px_0_0_rgba(31,28,11,0.3)]">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                <span className="font-bold text-stone-700">{tickets === null ? '—' : `${tickets} Tickets`}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 items-start">
            {/* Class filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mr-2">Class:</span>
              {CLASSES.map((cls) => {
                const active = activeClasses.has(cls.value);
                return (
                  <button
                    key={cls.value}
                    onClick={() => toggleClass(cls.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all border-2 active:scale-95
                      ${active
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-primary/50 text-outline'
                      }`}
                    style={active ? carvedBevel : undefined}
                  >
                    <span className="material-symbols-outlined text-[14px]">{cls.icon}</span>
                    {cls.label}
                  </button>
                );
              })}
            </div>

            {/* Type filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mr-2">Type:</span>
              {ITEM_TYPES.map((t) => {
                const active = activeTypes.has(t.value);
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all border-2 active:scale-95
                      ${active
                        ? 'bg-tertiary text-on-tertiary border-tertiary'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-tertiary/50'
                      }`}
                    style={active ? stoneBevel : undefined}
                  >
                    <span className="material-symbols-outlined text-[14px]">{TYPE_ICON[t.value]}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Rarity filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mr-2">Rarity:</span>
              {RARITIES.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRarity(r)}
                  className={`px-3 py-1 text-[10px] font-black uppercase border-2 transition-all active:scale-95
                    ${activeRarity === r
                      ? 'bg-stone-800 text-white border-stone-800'
                      : `bg-white border-stone-200 hover:border-stone-400 ${RARITY_COLOR[r]}`
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest italic">
              Showing {filtered.length} of {allItems.length} items
              {(activeClasses.size > 0 || activeTypes.size > 0 || activeRarity) && (
                <button
                  onClick={() => { setActiveClasses(new Set()); setActiveTypes(new Set()); setActiveRarity(''); }}
                  className="ml-3 font-black text-error hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </p>
          </div>
        </section>


        {/* ── Item Grid ───────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {loading && (
            <p className="col-span-4 text-center text-outline py-16 font-bold animate-pulse">
              Loading items…
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="col-span-4 text-center text-outline py-16 font-bold italic">
              No items match your filters.
            </p>
          )}
          {!loading && filtered.map((item) => (
            <ItemCard key={item._id} item={item} onBuy={handleBuy} stoneBevel={stoneBevel} />
          ))}
        </section>
      </div>
    </div>
  </div>
  );
}

/* ── sub-components ───────────────────────────────────────────────────────── */

function DailyCard({ item, fallbackTier, onBuy, style, badgeClass, accentClass, btnStyle, btnClass, icon, iconClass }) {
  const tier = item?.rarity ?? fallbackTier;
  const price = item?.price ?? '—';
  const lines = item ? formatBonusLines(item.statBonuses ?? {}, 3) : [];

  return (
    <div className="relative bg-surface p-1" style={style}>
      <div className="bg-surface-container flex flex-col md:flex-row h-full">
        <div className="w-full md:w-44 h-44 bg-stone-900 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
          {item?.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-90 relative z-10 drop-shadow-lg" />
          ) : (
            <span className={`material-symbols-outlined opacity-80 ${iconClass}`}
              style={{ fontSize: '96px', fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
          <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 tracking-tighter ${badgeClass}`}>
            {tier === 'SS' ? 'MYTHIC SS' : tier === 'S' ? 'LEGENDARY S' : `TIER ${tier}`}
          </div>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-headline font-black text-on-surface leading-tight italic">
              {item?.name ?? 'Loading…'}
            </h3>
            <p className={`font-bold mt-1 text-sm ${accentClass}`}>
              Tier: {tier} – {RARITY_LABEL[tier] ?? ''}
            </p>
            <div className="mt-3 space-y-1 border-l-2 border-outline/20 pl-3 italic opacity-80 text-sm">
              {item?.description && <p>{item.description.split('.')[0]}.</p>}
              {lines.map((l) => <p key={l}>{l}</p>)}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-on-surface">
                {typeof price === 'number' ? price.toLocaleString() : price}
              </span>
              <span className="text-primary font-bold">G</span>
            </div>
            <button
              onClick={() => item && onBuy(item)}
              disabled={!item}
              className={`px-6 py-3 font-headline font-bold active:scale-95 transition-transform disabled:opacity-40 ${btnClass}`}
              style={btnStyle}
            >
              ACQUIRE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, onBuy, stoneBevel }) {
  const lines = formatBonusLines(item.statBonuses ?? {}, 3);

  return (
    <div className="group relative bg-surface border-2 border-outline-variant/30 p-4 hover:border-primary/50 transition-colors flex flex-col h-full">
      <div className="aspect-square bg-surface-variant mb-4 flex items-center justify-center relative overflow-hidden flex-shrink-0">
        {item?.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform relative z-10 drop-shadow-md" />
        ) : (
          <span
            className="material-symbols-outlined text-on-surface-variant opacity-40 group-hover:scale-110 transition-transform"
            style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}
          >
            {TYPE_ICON[item.type] ?? 'inventory_2'}
          </span>
        )}
      </div>
      <h4 className="text-lg font-headline font-bold text-on-surface mb-1 leading-tight">{item.name}</h4>
      <p className={`text-xs font-black uppercase mb-3 ${RARITY_COLOR[item.rarity]}`}>
        {item.rarity} – {RARITY_LABEL[item.rarity]}
      </p>
      {item.reqClass !== 'all' && (
        <p className="text-xs font-bold text-outline uppercase mb-1 italic">
          {item.reqClass} only
        </p>
      )}
      <div className="space-y-0.5 text-sm opacity-80 border-t border-outline-variant/10 pt-3 min-h-[60px] flex-1">
        {lines.length > 0
          ? lines.map((l) => <p key={l}>{l}</p>)
          : <p className="italic text-outline">{item.description?.split('.')[0]}</p>
        }
      </div>
      <div className="mt-5 flex items-center justify-between mt-auto">
        <span className="font-black text-lg">
          {item.price.toLocaleString()} <span className="text-primary text-sm">G</span>
        </span>
        <button
          onClick={() => onBuy(item)}
          className="p-2 bg-tertiary text-on-tertiary active:scale-90 transition-all"
          style={stoneBevel}
        >
          <span className="material-symbols-outlined">shopping_cart</span>
        </button>
      </div>
    </div>
  );
}
