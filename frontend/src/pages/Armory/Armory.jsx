import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import { userApi } from '../../services/api';
import { computeClassScaledStats, formatBonusLines, getEquippedBonusFromInventory, mergeCoreStats } from '../../utils/stats';

const CLASS_ORDER = ['warrior', 'rogue', 'mage'];

const CLASS_LABEL = {
  warrior: 'WARRIOR',
  rogue: 'ROGUE',
  mage: 'MAGE',
};

const CLASS_ICON = {
  warrior: 'swords',
  rogue: 'sprint',
  mage: 'auto_stories',
};


const TYPE_ICON = {
  equipment: 'swords',
  potion: 'science',
  material: 'category',
  scroll: 'auto_stories',
};

const SLOT_ICON = {
  head: 'helm',
  weapon: 'swords',
  offhand: 'shield',
  body: 'shield_person',
  ring1: 'diamond',
  ring2: 'diamond',
};

export default function Armory() {
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [confirmedClass, setConfirmedClass] = useState('warrior');
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [gold, setGold] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classMsg, setClassMsg] = useState('');
  const [equipMsg, setEquipMsg] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  async function refreshInventoryAndEquip() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const [meRes, invRes] = await Promise.all([
      userApi.getMe(),
      userApi.getInventory(),
    ]);
    const me = meRes.data ?? {};
    setEquipped(me.equipped ?? {});
    setInventory(invRes.data ?? []);
    setGold(me.gold ?? 0);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadArmoryData() {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) {
          setLoading(false);
          setError('Login to view your armory.');
        }
        return;
      }

      try {
        const [meRes, invRes] = await Promise.all([userApi.getMe(), userApi.getInventory()]);

        if (cancelled) return;
        const me = meRes.data ?? {};
        const cls = CLASS_ORDER.includes(me.class) ? me.class : 'warrior';
        const profileClass = CLASS_ORDER.includes(me.classProfile?.confirmedClass)
          ? me.classProfile.confirmedClass
          : cls;

        setSelectedClass(cls);
        setConfirmedClass(profileClass);
        setLevel(Math.max(1, me.level ?? 1));
        setExp(Math.max(0, me.experience ?? 0));
        setGold(me.gold ?? 0);
        setEquipped(me.equipped ?? {});
        setInventory(invRes.data ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e.response?.data?.error ?? 'Failed to load armory data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadArmoryData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function handleFocusRefresh() {
      try {
        await refreshInventoryAndEquip();
      } catch {
        // Silent refresh fail.
      }
    }
    window.addEventListener('focus', handleFocusRefresh);
    window.addEventListener('storage', handleFocusRefresh);
    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      window.removeEventListener('storage', handleFocusRefresh);
    };
  }, []);

  useEffect(() => {
    if (!selectedItem && inventory.length > 0) {
      setSelectedItem(inventory[0]);
    }
  }, [inventory, selectedItem]);

  function handleClassChange(cls) {
    setSelectedClass(cls);
  }

  async function handleClassConfirm() {
    const token = localStorage.getItem('token');
    if (!token) {
      setClassMsg('Login to confirm your class.');
      return;
    }
    try {
      const res = await userApi.confirmClass(selectedClass);
      setConfirmedClass(selectedClass);
      if (res.data?.gold !== undefined) {
        setGold(res.data.gold);
      }
      setClassMsg(res.data?.message ?? `Class confirmed: ${CLASS_LABEL[selectedClass]}`);
    } catch (e) {
      setClassMsg(e.response?.data?.error ?? 'Failed to confirm class.');
    }
    setTimeout(() => setClassMsg(''), 2500);
  }

  function getEquipTargetSlot(item, equippedMap) {
    const slot = item?.equipSlot;
    if (!slot) return null;
    if (slot === 'ring') {
      return !equippedMap?.ring1 ? 'ring1' : !equippedMap?.ring2 ? 'ring2' : 'ring1';
    }
    return slot;
  }

  async function handleEquipSelected() {
    if (!selectedItem?.item || selectedItem.item.type !== 'equipment') return;
    const slot = getEquipTargetSlot(selectedItem.item, equipped);
    if (!slot) return;

    try {
      await userApi.equipItem(selectedItem._id, slot);
      setEquipMsg(`Equipped: ${selectedItem.item.name}`);

      setInventory((prev) =>
        prev.map((entry) => {
          if (entry._id === selectedItem._id) {
            return { ...entry, isEquipped: true, slotEquipped: slot };
          }
          if (entry.slotEquipped === slot) {
            return { ...entry, isEquipped: false, slotEquipped: null };
          }
          return entry;
        }),
      );

      setEquipped((prev) => ({ ...prev, [slot]: selectedItem._id }));
    } catch (e) {
      setEquipMsg(e.response?.data?.error ?? 'Failed to equip item.');
    }
    setTimeout(() => setEquipMsg(''), 2500);
  }

  async function handleUnequipSelected() {
    if (!selectedItem?._id || !selectedItem?.isEquipped) return;
    try {
      const { data } = await userApi.unequipItem(selectedItem._id);
      const slot = data?.slot ?? selectedItem.slotEquipped;
      setEquipMsg(`Unequipped: ${selectedItem.item?.name ?? 'Item'}`);

      setInventory((prev) =>
        prev.map((entry) => {
          if (entry._id === selectedItem._id) {
            return { ...entry, isEquipped: false, slotEquipped: null };
          }
          return entry;
        }),
      );
      if (slot) {
        setEquipped((prev) => ({ ...prev, [slot]: null }));
      }
      setSelectedItem((prev) => prev ? { ...prev, isEquipped: false, slotEquipped: null } : prev);
    } catch (e) {
      setEquipMsg(e.response?.data?.error ?? 'Failed to unequip item.');
    }
    setTimeout(() => setEquipMsg(''), 2500);
  }

  const stats = useMemo(() => computeClassScaledStats(confirmedClass, level), [confirmedClass, level]);
  const equippedBonus = useMemo(() => getEquippedBonusFromInventory(inventory), [inventory]);
  const totalStats = useMemo(() => mergeCoreStats(stats, equippedBonus), [stats, equippedBonus]);
  const expToNext = Math.max(100, level * 100);
  const expPct = Math.max(0, Math.min(100, Math.round((exp / expToNext) * 100)));
  const capacity = 16;
  const usedSlots = inventory.length;
  const displayedInventory = inventory.slice(0, capacity);
  const emptySlots = Math.max(0, capacity - displayedInventory.length);
  const equippedSlots = [
    { key: 'head', label: 'Head', fallbackIcon: 'chef_hat' },
    { key: 'weapon', label: 'Main Hand', fallbackIcon: 'swords' },
    { key: 'offhand', label: 'Off Hand', fallbackIcon: 'shield' },
    { key: 'body', label: 'Torso', fallbackIcon: 'shield_person' },
    { key: 'ring1', label: 'Ring 1', fallbackIcon: 'diamond' },
    { key: 'ring2', label: 'Ring 2', fallbackIcon: 'diamond' },
  ];

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Character Sprite & Class Selection */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container border-4 border-on-surface p-1 shadow-[8px_8px_0px_0px_rgba(31,28,11,1)]">
            <div 
              className="bg-surface-container-highest border-2 border-outline p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 2px, transparent 2px, transparent 4px)' }}
            >
              {/* Character Display */}
              <div className="relative z-10 scale-[2.5] mb-8">
                <span className="material-symbols-outlined text-primary text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_play</span>
              </div>
              
              {/* Class Selection Tabs */}
              <div className="w-full flex justify-center gap-2 mt-auto">
                {CLASS_ORDER.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={`px-4 py-2 font-headline font-bold border-2 active:translate-y-0.5 transition-all
                      ${selectedClass === cls
                        ? 'bg-primary text-on-primary border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)]'
                        : 'bg-surface-container-low text-primary border-outline shadow-[2px_2px_0px_0px_rgba(128,118,102,1)] hover:bg-surface-container-high'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm mr-1">{CLASS_ICON[cls]}</span>
                    {CLASS_LABEL[cls]}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClassConfirm}
                  className={`px-4 py-2 border-2 font-headline font-bold transition-colors ${
                    selectedClass !== confirmedClass
                      ? 'bg-primary text-on-primary border-primary-container'
                      : 'bg-tertiary text-on-tertiary border-tertiary-container'
                  }`}
                >
                  {selectedClass !== confirmedClass ? 'Confirm New Class' : 'Class Confirmed'}
                </button>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-outline">
                    Current: {CLASS_LABEL[confirmedClass]}
                  </span>
                  {selectedClass !== confirmedClass && (
                    <span className="text-[10px] font-black text-primary-container animate-pulse">
                      CHANGE COST: 1,000G
                    </span>
                  )}
                </div>
              </div>
              {classMsg && <p className="text-xs font-bold text-primary mt-2">{classMsg}</p>}
              
              {/* Visual Accent: Page Fold */}
              <div 
                className="absolute top-0 right-0 w-12 h-12 bg-surface-dim shadow-[-2px_2px_0px_0px_rgba(0,0,0,0.1)]" 
                style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
              ></div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-surface-container p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
            <h2 className="font-headline text-2xl font-extrabold text-primary mb-4 border-b-2 border-primary-container pb-2">
              CHARACTER ATTRIBUTES
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-outline uppercase tracking-tighter">Level</span>
                <span className="font-headline text-xl font-bold">{level}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-outline uppercase tracking-tighter">Experience</span>
                <span className="font-headline text-xl font-bold">{exp.toLocaleString()} / {expToNext.toLocaleString()}</span>
              </div>
              <div className="col-span-2 bg-surface-variant h-3 border border-outline relative">
                <div className="absolute inset-0 bg-primary-container" style={{ width: `${expPct}%` }}></div>
              </div>

              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">HP</span>
                <span className="font-headline font-bold text-error">{totalStats.hp}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">MP</span>
                <span className="font-headline font-bold text-tertiary">{totalStats.mp}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">AD</span>
                <span className="font-headline font-bold">{totalStats.ad}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">AP</span>
                <span className="font-headline font-bold">{totalStats.ap}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">Armor</span>
                <span className="font-headline font-bold">{totalStats.armor}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">MR</span>
                <span className="font-headline font-bold">{totalStats.mr}</span>
              </div>
              <div className="flex justify-between items-center py-1 mt-2 bg-yellow-900/10 px-2 border border-yellow-900/20">
                <span className="text-sm font-bold uppercase text-yellow-900">Current Gold</span>
                <span className="font-headline font-bold text-yellow-800">{gold.toLocaleString()}G</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Inventory & Equipment */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Equipment Slots */}
          <div className="bg-surface-container-high p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
            <h2 className="font-headline text-2xl font-extrabold text-primary mb-6">CURRENTLY EQUIPPED</h2>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {equippedSlots.map((slot) => {
                const userItemId = equipped?.[slot.key];
                const entry = inventory.find((it) => it._id === userItemId);
                return (
                <button
                  type="button"
                  key={slot.key}
                  onClick={async () => {
                    if (!entry) return;
                    try {
                      await userApi.unequipItem(entry._id);
                      setInventory((prev) => prev.map((it) => it._id === entry._id ? { ...it, isEquipped: false, slotEquipped: null } : it));
                      setEquipped((prev) => ({ ...prev, [slot.key]: null }));
                      setEquipMsg(`Unequipped from ${slot.label}: ${entry.item?.name ?? 'Item'}`);
                    } catch (e) {
                      setEquipMsg(e.response?.data?.error ?? 'Failed to unequip from slot.');
                    }
                    setTimeout(() => setEquipMsg(''), 2500);
                  }}
                  className="group flex flex-col items-center gap-2"
                  title={entry ? `Click to unequip ${entry.item?.name ?? 'item'}` : `${slot.label} empty`}
                >
                  <div className={`w-16 h-16 bg-surface-variant border-2 border-outline flex items-center justify-center relative shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)] ${entry ? 'hover:border-error' : ''}`}>
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-fixed/20">
                      <span className="material-symbols-outlined text-on-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {entry ? (SLOT_ICON[slot.key] ?? slot.fallbackIcon) : slot.fallbackIcon}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase">{slot.label}</span>
                  <span className="text-[10px] text-outline-variant h-3">
                    {entry?.item?.name ?? 'Empty'}
                  </span>
                </button>
              )})}
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="bg-surface-container p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] relative overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-headline text-3xl font-extrabold text-primary">LEATHER RUCKSACK</h2>
              <span className="text-xs font-bold text-outline-variant uppercase bg-on-surface px-2 py-1 text-surface">
                Capacity: {usedSlots}/{capacity}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto lg:mx-0">
              {displayedInventory.map((entry) => (
                <button
                  key={entry._id}
                  type="button"
                  onClick={() => setSelectedItem(entry)}
                  className={`aspect-square bg-surface-variant border-2 p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] ${
                    entry.isEquipped ? 'border-primary' : 'border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {TYPE_ICON[entry.item?.type] ?? 'inventory_2'}
                  </span>
                  {(entry.quantity ?? 1) > 1 && (
                    <span className="absolute bottom-1 right-1 text-xs font-bold bg-on-surface text-surface px-1">
                      x{entry.quantity}
                    </span>
                  )}
                </button>
              ))}

              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"></div>
              ))}
            </div>

            {/* Item Detail Tooltip Simulation */}
            <div className="mt-6 p-4 border-2 border-primary bg-surface-container-low">
              {loading && <p className="text-sm italic">Loading armory...</p>}
              {!loading && error && <p className="text-sm text-error">{error}</p>}
              {!loading && !error && !selectedItem && (
                <p className="text-sm italic text-on-surface-variant">No items in inventory yet. Buy from shop or roll the gacha chest.</p>
              )}
              {!loading && !error && selectedItem && (
                <>
                  <h3 className="font-headline font-bold text-lg text-on-surface">{selectedItem.item?.name ?? 'Unknown Item'}</h3>
                  <p className="text-xs italic text-on-surface-variant mb-2">{selectedItem.item?.description ?? 'No description.'}</p>
                  <div className="flex flex-wrap gap-4">
                    {formatBonusLines(selectedItem.item?.statBonuses ?? {}, 4).map((line) => (
                      <span key={line} className="text-[10px] font-bold uppercase text-primary">{line}</span>
                    ))}
                  </div>
                  {selectedItem.item?.type === 'equipment' ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleEquipSelected}
                        className="px-3 py-2 bg-primary text-on-primary font-bold text-xs uppercase"
                      >
                        Equip to {getEquipTargetSlot(selectedItem.item, equipped)}
                      </button>
                      {selectedItem.isEquipped && (
                        <button
                          type="button"
                          onClick={handleUnequipSelected}
                          className="px-3 py-2 bg-error text-on-error font-bold text-xs uppercase"
                        >
                          Unequip
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-outline italic">Only equipment items can be equipped.</p>
                  )}
                  {equipMsg && <p className="text-xs font-bold mt-2 text-primary">{equipMsg}</p>}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
