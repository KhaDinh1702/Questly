import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import { userApi } from '../../services/api';
import warriorImg from '../../assets/images/classes/warrior.jpg';
import mageImg from '../../assets/images/classes/mage.png';
import rogueImg from '../../assets/images/classes/rogue.jpg';
import { computeClassScaledStats, formatBonusLines, getEquippedBonusFromInventory, mergeCoreStats } from '../../utils/stats';
import './Armory.css';

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

const CLASS_IMAGE = {
  warrior: warriorImg,
  rogue: rogueImg,
  mage: mageImg,
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
  legs: 'stat_3',
  feet: 'footprint',
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
  const [capacity, setCapacity] = useState(5);
  const [activeTab, setActiveTab] = useState('Character');

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
    setCapacity(me.maxBackpackSlots ?? 5);
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
        setCapacity(me.maxBackpackSlots ?? 5);
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
  const usedSlots = inventory.length;
  const displayedInventory = inventory.slice(0, capacity);
  const emptySlots = Math.max(0, capacity - displayedInventory.length);
  const equippedSlots = [
    { key: 'head', label: 'Head', fallbackIcon: 'chef_hat' },
    { key: 'weapon', label: 'Main Hand', fallbackIcon: 'swords' },
    { key: 'offhand', label: 'Off Hand', fallbackIcon: 'shield' },
    { key: 'body', label: 'Torso', fallbackIcon: 'shield_person' },
    { key: 'legs', label: 'Legs', fallbackIcon: 'stat_3' },
    { key: 'feet', label: 'Feet', fallbackIcon: 'footprint' },
    { key: 'ring1', label: 'Ring 1', fallbackIcon: 'diamond' },
    { key: 'ring2', label: 'Ring 2', fallbackIcon: 'diamond' },
  ];

  return (
    <div
      className="text-on-surface font-body min-h-screen pb-24 flex flex-col"
      style={{
        backgroundImage: "url('/maps/Armory.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navbar />

      <main className="journal-container">
        <div className="journal-book relative transition-transform">
          
          {/* Tabs */}
          <div className="journal-tab-group">
            {['Character', 'Bestiary', 'Items'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`journal-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Left Page: Profile, Stats, Equipment, Compact Grid */}
          <div className="journal-page journal-page-left custom-scrollbar overflow-y-auto">
            {activeTab === 'Character' && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h1 className="medieval-text text-4xl text-black/80">{CLASS_LABEL[confirmedClass]}</h1>
                  <div className="text-right">
                    <p className="pixel-text text-xl">LVL {level}</p>
                    <p className="pixel-text text-sm text-black/50">{exp.toLocaleString()} / {expToNext.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start mb-4">
                  {/* Portrait */}
                  <div className="w-28 flex-shrink-0 aspect-[3/4] border-2 border-black/20 shadow-lg bg-surface-container overflow-hidden">
                    <img
                      src={CLASS_IMAGE[selectedClass] ?? CLASS_IMAGE.warrior}
                      alt="Portrait"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Stat Table */}
                  <div className="flex-grow">
                    <div className="stat-table">
                      {[
                        { label: 'Health', value: totalStats.hp, color: 'text-error' },
                        { label: 'Mana', value: totalStats.mp, color: 'text-tertiary' },
                        { label: 'Attack', value: totalStats.ad },
                        { label: 'Power', value: totalStats.ap },
                        { label: 'Armor', value: totalStats.armor },
                        { label: 'Resistance', value: totalStats.mr },
                      ].map((s) => (
                        <div key={s.label} className="stat-row">
                          <span className="stat-label">{s.label}</span>
                          <span className={`stat-value ${s.color ?? ''}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Equipment Row */}
                <h3 className="pixel-text text-lg mb-2 uppercase border-b border-black/10">Equipped</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {equippedSlots.map((slot) => {
                    const userItemId = equipped?.[slot.key];
                    const entry = inventory.find((it) => it._id === userItemId);
                    return (
                      <button
                        key={slot.key}
                        onClick={() => entry && setSelectedItem(entry)}
                        className={`w-10 h-10 border-2 bg-black/5 flex items-center justify-center relative transition-colors ${
                          entry ? 'border-primary' : 'border-black/20'
                        }`}
                        title={slot.label}
                      >
                        {entry?.item?.imageUrl ? (
                          <img src={entry.item.imageUrl} alt={slot.label} className="w-full h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-sm opacity-20">
                            {SLOT_ICON[slot.key] ?? 'help'}
                          </span>
                        )}
                        {entry && selectedItem?._id === entry._id && (
                           <div className="absolute inset-0 border-2 border-primary animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Inventory Grid (Compact) */}
                <div className="flex justify-between items-center mb-1">
                  <h3 className="pixel-text text-lg uppercase">Backpack</h3>
                  <span className="pixel-text text-xs text-black/40">{inventory.length} / {capacity}</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {displayedInventory.map((entry) => (
                    <button
                      key={entry._id}
                      onClick={() => setSelectedItem(entry)}
                      className={`aspect-square border p-1 bg-black/5 hover:bg-black/10 transition-colors ${
                        selectedItem?._id === entry._id ? 'border-primary ring-1 ring-primary' : 'border-black/10'
                      } ${entry.isEquipped ? 'bg-primary/10' : ''}`}
                    >
                      {entry.item?.imageUrl ? (
                        <img src={entry.item.imageUrl} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-xl opacity-40">
                          {TYPE_ICON[entry.item?.type] ?? 'inventory_2'}
                        </span>
                      )}
                    </button>
                  ))}
                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border border-black/5 bg-black/2" />
                  ))}
                </div>
              </>
            )}

            {activeTab === 'Bestiary' && (
              <div className="text-center py-20 italic pixel-text opacity-40">Monster records not yet discovered...</div>
            )}
            {activeTab === 'Items' && (
              <div className="text-center py-20 italic pixel-text opacity-40">World artifacts will appear here.</div>
            )}
          </div>

          <div className="journal-spine" />

          {/* Right Page: Secondary Info & Detailed Tooltip */}
          <div className="journal-page journal-page-right custom-scrollbar overflow-y-auto">
            {activeTab === 'Character' && (
              <>
                <div className="mb-4 p-3 bg-black/5 border border-black/10">
                  <h3 className="pixel-text text-lg border-b border-black/10 mb-2">World Status</h3>
                  <div className="flex justify-between text-sm pixel-text mb-1">
                    <span>Gold (Kept)</span>
                    <span className="text-yellow-800 font-bold">{gold.toLocaleString()} G</span>
                  </div>
                  <div className="flex justify-between text-sm pixel-text mb-1 opacity-50">
                    <span>Relics Found</span>
                    <span>0</span>
                  </div>
                </div>

                {/* Selected Item Detail / Tooltip */}
                <div className="flex-grow flex flex-col">
                  {selectedItem ? (
                    <div className="flex-grow flex flex-col">
                      <div className="flex gap-4 mb-4">
                        <div className="w-16 h-16 bg-black/5 border-2 border-black/20 p-2 flex items-center justify-center">
                          {selectedItem.item?.imageUrl ? (
                            <img src={selectedItem.item.imageUrl} className="w-full h-full object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-4xl opacity-50">
                              {TYPE_ICON[selectedItem.item?.type] ?? 'inventory_2'}
                            </span>
                          )}
                        </div>
                        <div>
                          <h2 className="medieval-text text-2xl mb-0">{selectedItem.item?.name}</h2>
                          <p className="pixel-text text-sm text-black/60 capitalize">{selectedItem.item?.type} | {selectedItem.item?.rarity}</p>
                        </div>
                      </div>

                      <div className="pixel-text text-sm italic mb-4 leading-relaxed p-3 bg-black/2 border-l-4 border-black/10 uppercase font-bold text-black/40">
                        "{selectedItem.item?.description || 'A simple object with unknown power.'}"
                      </div>

                      <div className="bg-black/5 p-4 border border-black/10 mb-6">
                        <h4 className="pixel-text text-xs uppercase mb-2 opacity-60 font-bold">Attunements</h4>
                        <div className="space-y-1">
                          {formatBonusLines(selectedItem.item?.statBonuses ?? {}, 4).map((line) => (
                            <div key={line} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
                              <span className="pixel-text text-sm">{line}</span>
                            </div>
                          ))}
                          {(!selectedItem.item?.statBonuses || Object.keys(selectedItem.item.statBonuses).length === 0) && (
                            <p className="pixel-text text-xs italic opacity-40">No magical attunements.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex gap-2">
                          {selectedItem.item?.type === 'equipment' && (
                            <>
                              {selectedItem.isEquipped ? (
                                <button
                                  onClick={handleUnequipSelected}
                                  className="pixel-text px-4 py-2 bg-red-900 text-white border-2 border-black/40 hover:bg-red-800 transition-colors text-sm"
                                >
                                  Unequip
                                </button>
                              ) : (
                                <button
                                  onClick={handleEquipSelected}
                                  className="pixel-text px-4 py-2 bg-[#4a3728] text-white border-2 border-black/40 hover:bg-[#5a4738] transition-colors text-sm"
                                >
                                  Equip {getEquipTargetSlot(selectedItem.item, equipped)}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        {equipMsg && <p className="pixel-text text-xs mt-2 text-primary">{equipMsg}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-center p-10 opacity-30 italic pixel-text">
                      Select an item from your backpack to see details.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'Bestiary' && (
              <div className="text-center py-20 px-10 italic pixel-text opacity-40">
                Study the creatures of the dungeon to fill these pages...
              </div>
            )}
            {activeTab === 'Items' && (
              <div className="text-center py-20 px-10 italic pixel-text opacity-40">
                Collect special artifacts during your journey.
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Class Change at Bottom (Floating) */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center bg-black/20 backdrop-blur-sm z-50">
        <div className="flex items-center gap-6 bg-[#f4e4bc] p-3 border-4 border-[#4a3728] shadow-2xl">
          <div className="flex gap-2">
            {CLASS_ORDER.map((cls) => (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                className={`w-12 h-12 flex items-center justify-center border-2 transition-all ${
                  selectedClass === cls ? 'bg-primary border-black/40 scale-110 shadow-lg' : 'bg-black/10 border-black/10'
                }`}
              >
                <span className="material-symbols-outlined">{CLASS_ICON[cls]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <button
              onClick={handleClassConfirm}
              className={`px-6 py-2 pixel-text text-lg border-2 border-black/40 transition-colors ${
                selectedClass !== confirmedClass ? 'bg-primary text-white' : 'bg-green-800 text-white opacity-50'
              }`}
            >
              {selectedClass !== confirmedClass ? `Change to ${CLASS_LABEL[selectedClass]} (1000G)` : `Confirmed: ${CLASS_LABEL[confirmedClass]}`}
            </button>
            {classMsg && <p className="pixel-text text-[10px] text-center mt-1 text-primary-fixed">{classMsg}</p>}
          </div>
        </div>
      </footer>
    </div>
  );
}
