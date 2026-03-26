import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dungeonApi, userApi } from '../../services/api';
import Navbar from '../../components/Navbar';
import { computeClassScaledStats, getEquippedBonusFromInventory, mergeCoreStats } from '../../utils/stats';

// ── Cell type helpers ────────────────────────────────────────
const CELL_ICONS = {
  empty: { icon: null, bg: 'bg-stone-700 border-stone-600', opacity: '' },
  wall: { icon: null, bg: 'bg-stone-800', opacity: 'opacity-40' },
  start: { icon: 'flag', bg: 'bg-stone-700 border-stone-600', opacity: '' },
  exit: { icon: 'door_open', bg: 'bg-green-900 border-green-600', opacity: '' },
  chest: { icon: 'inventory_2', bg: 'bg-yellow-900 border-yellow-700', opacity: '' },
  shop: { icon: 'storefront', bg: 'bg-blue-900 border-blue-700', opacity: '' },
  monster: { icon: 'skull', bg: 'bg-stone-700 border-stone-600', opacity: '' },
  mini_boss: { icon: 'skull', bg: 'bg-red-950 border-red-800', opacity: '' },
  big_boss: { icon: 'skull', bg: 'bg-purple-950 border-purple-800', opacity: '' },
  cleared: { icon: 'check_circle', bg: 'bg-stone-900 border-stone-700', opacity: 'opacity-40' },
}

function GridCell({ type, isPlayer, isVisible, playerClass }) {
  if (!isVisible) {
    return (
      <div className="w-16 h-16 md:w-20 md:h-20 border-2 bg-black opacity-80 border-stone-900 flex items-center justify-center relative">
        <span className="material-symbols-outlined text-stone-800 text-2xl">visibility_off</span>
      </div>
    );
  }

  const cfg = CELL_ICONS[type] || CELL_ICONS.wall;
  const iconColor =
    type === 'monster' ? 'text-red-400' :
      type === 'mini_boss' ? 'text-orange-400' :
        type === 'big_boss' ? 'text-purple-400' :
          type === 'exit' ? 'text-green-400' :
            type === 'chest' ? 'text-yellow-400' :
              type === 'shop' ? 'text-blue-400' :
                type === 'cleared' ? 'text-stone-600' : 'text-stone-600';

  return (
    <div
      className={`w-16 h-16 md:w-20 md:h-20 border-2 flex items-center justify-center relative
        ${cfg.bg} ${cfg.opacity}
        ${isPlayer ? 'border-4 border-primary shadow-[inset_0_0_20px_rgba(202,176,17,0.5)]' : ''}
      `}
      style={type === 'wall' ? {
        backgroundImage: 'url("https://i.pinimg.com/736x/dc/fb/8f/dcfb8ffad08bd64acb79c956f694af68.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'sepia(40%) contrast(1.1) brightness(0.6)'
      } : {}}
    >
      {isPlayer && (
        <>
          <div className="absolute inset-0 bg-primary opacity-10 animate-pulse" />
          <img
            src={playerClass === 'mage' ? '/images/player_mage.png' : (playerClass === 'rogue' ? '/images/player_rogue.png' : '/images/player_knight.png')}
            alt="player"
            className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg z-10"
            style={{ mixBlendMode: 'multiply' }}
          />
        </>
      )}
      {!isPlayer && (type === 'monster' || type === 'mini_boss' || type === 'big_boss') && (
        <img
          src="/images/skeleton_icon.png"
          alt="monster icon"
          className="w-10 h-10 md:w-12 md:h-12 object-contain"
          style={{ mixBlendMode: 'screen' }}
        />
      )}
      {!isPlayer && type === 'chest' && (
        <img
          src="/images/chest.png"
          alt="chest"
          className="w-10 h-10 md:w-12 md:h-12 object-contain"
          style={{ mixBlendMode: 'multiply' }}
        />
      )}
      {!isPlayer && cfg.icon && !['monster', 'mini_boss', 'big_boss', 'chest'].includes(type) && (
        <span
          className={`material-symbols-outlined ${iconColor}`}
          style={type === 'chest' ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {cfg.icon}
        </span>
      )}
    </div>
  );
}

// ── Static 5×5 wall grid (fallback before a real run is loaded) ───
const DEFAULT_GRID = [
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
]

// ── Dungeon Page ─────────────────────────────────────────────
export default function Dungeon() {
  const navigate = useNavigate();

  // ── Auth Check ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // ── State ─────────────────────────────────────────────────
  const [run, setRun] = useState(null);
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const [playerX, setPlayerX] = useState(2);
  const [playerY, setPlayerY] = useState(2);
  const [visited, setVisited] = useState(new Set(['2-2']));
  const [turnCount, setTurnCount] = useState(1);

  const [floor, setFloor] = useState(1);
  const [log, setLog] = useState('"The air grows heavy with the scent of damp moss and iron."');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Player Level state
  const [playerLevel, setPlayerLevel] = useState({ level: 1, exp: 0, expToNextLevel: 100, turns: 0 });
  const [allocatingStat, setAllocatingStat] = useState('');
  const [displayStats, setDisplayStats] = useState({ hp: 120, mp: 10, ad: 12, ap: 0, armor: 10, mr: 5 });
  const [combatSubMenu, setCombatSubMenu] = useState(null); // 'atk' | 'item' | null
  const [combatState, setCombatState] = useState(null);
  const [inventory, setInventory] = useState([]); // Track user inventory items
  const [shopItems, setShopItems] = useState([]);
  const [chestLoot, setChestLoot] = useState(null); // loot item
  const [chestReward, setChestReward] = useState(null); // { rewardType, goldEarned, ticketsEarned }
  const [playerClass, setPlayerClass] = useState('warrior'); // Track player class for mana costs

  // ── Init & Fetch ──────────────────────────────────────────
  useEffect(() => {
    fetchActiveRun();
    fetchPlayerLevel();
  }, []);

  // ── Auto-Flee on Tab Switch or Unmount ────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && combatState) {
        dungeonApi.combatAction('flee').catch(() => {});
        setCombatState(null);
        flash('You fled the combat by leaving the tab! The monster vanished.');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      // Auto-flee on component unmount
      if (combatState) {
        dungeonApi.combatAction('flee').catch(() => {});
      }
    };
  }, [combatState]);

  async function fetchPlayerLevel() {
    if (!localStorage.getItem('token')) return;
    try {
      const [levelRes, meRes, invRes] = await Promise.all([
        dungeonApi.getLevel(),
        userApi.getMe(),
        userApi.getInventory(),
      ]);
      setPlayerLevel(levelRes.data);
      setInventory(invRes.data ?? []);

      const me = meRes.data ?? {};
      const cls = me.classProfile?.confirmedClass ?? me.class ?? 'warrior';
      setPlayerClass(cls);
      const base = computeClassScaledStats(cls, levelRes.data?.level ?? 1);
      const bonus = getEquippedBonusFromInventory(invRes.data ?? []);
      setDisplayStats(mergeCoreStats(base, bonus));
    } catch {
      // ignore
    }
  }

  async function allocateStatPoint(statKey) {
    if (allocatingStat) return;
    setAllocatingStat(statKey);
    try {
      await userApi.allocateStat(statKey, 1);
      await fetchPlayerLevel();
      flash(`Upgraded ${statKey.toUpperCase()} by spending 1 stat point.`);
    } catch (e) {
      flash(e.response?.data?.error || 'Failed to allocate stat point.', true);
    } finally {
      setAllocatingStat('');
    }
  }

  async function fetchActiveRun() {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await dungeonApi.getActive();
      applyRun(res.data);
    } catch {
      // no active run yet
    }
  }

  function applyRun(data) {
    setRun(data);
    setGrid(data.grid);
    setPlayerX(data.currentPos.r);
    setPlayerY(data.currentPos.c);
    setFloor(data.currentFloor);
    setTurnCount(data.turnCount || 1);
    
    // If the run loads with combat State active, it means the user left/refreshed during combat.
    // They auto-fail/flee the combat.
    if (data.combatState) {
      dungeonApi.combatAction('flee').then(() => {
        fetchActiveRun(); // refresh grid to get the cleared cell
      }).catch(() => {});
      setCombatState(null);
      flash('The monster vanished while you were gone.');
    } else {
      setCombatState(null);
    }

    const vSet = new Set(data.visitedCells.map(c => `${c.r}-${c.c}`));
    setVisited(vSet);
  }

  // ── Actions ────────────────────────────────────────────────
  async function startRun() {
    setLoading(true);
    try {
      // Always start from floor 1, do not resume or save progress
      const res = await dungeonApi.start(1);
      applyRun(res.data.run);
      flash('Dungeon run started! Good luck, adventurer.');
    } catch (e) {
      flash(e.response?.data?.error || 'Failed to start run', true);
    } finally {
      setLoading(false);
    }
  }

  async function abandonRun() {
    if (!window.confirm('Are you sure you want to abandon this run? You will lose any current progress, but escape safely.')) return;
    setLoading(true);
    try {
      await dungeonApi.end();
      setRun(null);
      // Reset all local states to defaults
      setGrid(DEFAULT_GRID);
      setPlayerX(2);
      setPlayerY(2);
      setVisited(new Set(['2-2']));
      setTurnCount(1);
      setFloor(1);
      setCombatState(null);
      setLog('"The air grows heavy with the scent of damp moss and iron."');
      flash('Run abandoned. You escaped to the surface.');
    } catch (e) {
      flash('Failed to abandon run', true);
    } finally {
      setLoading(false);
    }
  }

  const DIR_MAP = { up: 'up', down: 'down', left: 'left', right: 'right' };

  function getVisibleCells(r, c) {
    const cells = [`${r}-${c}`];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      cells.push(`${r + dr}-${c + dc}`);
    }
    return cells;
  }

  async function move(dir) {
    if (loading || combatState || shopItems.length > 0 || chestLoot) return;
    setLoading(true);
    try {
      const res = await dungeonApi.move(DIR_MAP[dir]);
      const { cell, position, turnCount: newTurnCount } = res.data;
      setPlayerX(position.r);
      setPlayerY(position.c);
      if (newTurnCount) setTurnCount(newTurnCount);
      setVisited(prev => new Set([...prev, ...getVisibleCells(position.r, position.c)]));

      if (['monster', 'mini_boss', 'big_boss'].includes(cell)) flash('⚔️ A monster lurks here! Prepare for combat.');
      else if (cell === 'chest') flash('🎁 A sealed chest sits in the dust.');
      else if (cell === 'shop') flash('💰 A mysterious merchant is here.');
      else if (cell === 'exit') flash('🚪 You found the exit! Advance to the next floor?');
      else flash('You move deeper into the darkness...');

      fetchPlayerLevel(); // Refresh MP/HP in HUD after movement regen
    } catch (e) {
      flash(e.response?.data?.error || 'Cannot move there', true);
    } finally {
      setLoading(false);
    }
  }

  async function startCombat() {
    setLoading(true);
    try {
      const res = await dungeonApi.combatStart();
      setCombatState(res.data.combatState);
      setCombatSubMenu(null); // Reset sub-menu when combat starts
      flash(`Engaged ${res.data.combatState.monsterName}!`);
    } catch (e) {
      flash(e.response?.data?.error || 'Cannot start combat', true);
    } finally {
      setLoading(false);
    }
  }

  async function doCombatAction(action, itemId = null) {
    setLoading(true);
    try {
      const res = await dungeonApi.combatAction(action, itemId);
      setCombatSubMenu(null); // Reset sub-menu after any action
      if (res.data.outcome === 'victory') {
        const { expEarned, goldEarned, levelUp, lootItem } = res.data;
        setCombatState(null);
        let msg = `Victory! Earned ${goldEarned}G and ${expEarned} EXP.`;
        if (levelUp && levelUp.levelsGained > 0) msg += ` LEVEL UP! You are now level ${levelUp.level}!`;
        if (lootItem) msg += ` Boss dropped an item!`;
        flash(msg);
        fetchPlayerLevel(); // refresh EXP bar
        fetchActiveRun();   // refresh grid (cleared cell)
      } else if (res.data.outcome === 'defeat') {
        setCombatState(null);
        flash(`DEFEAT! You died and lost ${res.data.goldLost} gold. Run ended.`, true);
        fetchActiveRun(); // Should load as null/failed
      } else if (res.data.outcome === 'fled') {
        setCombatState(null);
        flash('You fled the combat! The monster remains.');
      } else {
        // Ongoing - force deep copy to ensure React re-renders both HP and MP
        const clone = JSON.parse(JSON.stringify(res.data.combatState));
        setCombatState(clone);
        fetchPlayerLevel(); // Refresh HUD stats (Mana) after every turn
      }
    } catch (e) {
      flash(e.response?.data?.error || 'Combat error', true);
    } finally {
      setLoading(false);
    }
  }

  async function doOpenChest() {
    setLoading(true);
    try {
      const res = await dungeonApi.openChest();
      setChestReward({
        rewardType: res.data.rewardType,
        goldEarned: res.data.goldEarned,
        ticketsEarned: res.data.ticketsEarned,
      });
      if (res.data.lootItem) {
        setChestLoot(res.data.lootItem);
      }

      let msg = 'Chest opened! ';
      if (res.data.rewardType === 'gold') {
        msg += `Found ${res.data.goldEarned}G!`;
      } else if (res.data.rewardType === 'ticket') {
        msg += `Found ${res.data.ticketsEarned} ticket${res.data.ticketsEarned > 1 ? 's' : ''}!`;
      } else if (res.data.rewardType === 'item') {
        msg += `Found a ${res.data.lootItem?.item?.rarity || 'rare'} item!`;
      }
      flash(msg);
      fetchActiveRun();
      fetchPlayerLevel();
    } catch (e) {
      flash(e.response?.data?.error || 'Cannot open chest', true);
    } finally {
      setLoading(false);
    }
  }

  async function doNextFloor() {
    setLoading(true);
    try {
      const res = await dungeonApi.nextFloor();
      if (res.data.completed) {
        flash('DUNGEON COMPLETE! Returning to surface.');
        setRun(null);
      } else {
        applyRun({
          ...run,
          currentFloor: res.data.currentFloor,
          grid: res.data.grid,
          currentPos: res.data.startPos,
          visitedCells: [res.data.startPos],
          combatState: null
        });
        flash(`Descended to Floor ${res.data.currentFloor}.`);
      }
    } catch (e) {
      flash(e.response?.data?.error || 'Cannot go to next floor', true);
    } finally {
      setLoading(false);
    }
  }

  // ── Keyboard controls ─────────────────────────────────────
  const handleKey = useCallback((e) => {
    // Only allow movement if there is no blocking modal (combat, chest, etc)
    if (combatState || chestLoot || shopItems.length > 0) return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  }, [loading, combatState, chestLoot, shopItems]); // eslint-disable-line

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function flash(msg, isError = false) {
    setLog(isError ? `⚠️ ${msg}` : `"${msg}"`);
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  // ── Class-based Mana Costs ─────────────────────────────────────
  const getManaCosts = () => {
    const costs = {
      warrior: { normalAtk: 0, heavyAtk: 0, spell: 0, rest: 0, RestRestoresMP: 0 },
      rogue: { normalAtk: 2, heavyAtk: 8, spell: 0, rest: -8, RestRestoresMP: 8 },
      mage: { normalAtk: 8, heavyAtk: 20, spell: 0, rest: -20, RestRestoresMP: 20 },
    };
    return costs[playerClass] || costs.warrior;
  };
  const manaCosts = getManaCosts();

  // ── Evaluate cell context ─────────────────────────────────
  const currentCellType = run ? grid[playerX][playerY] : 'empty';
  const showEngage = ['monster', 'mini_boss', 'big_boss'].includes(currentCellType) && !combatState;
  const showChestBtn = currentCellType === 'chest';
  const showExitBtn = currentCellType === 'exit';

  // ── Render Helpers ────────────────────────────────────────
  const renderCombatModal = () => {
    if (!combatState) return null;
    const {
      monsterName, monsterLevel, monsterHp, monsterMaxHp,
      monsterAd, monsterArmor, monsterAp, monsterMr,
      cellType,
      playerHp, playerMaxHp, playerMana, playerMaxMana, turn, log: combatLog
    } = combatState;

    // Get last turn log for display
    const lastLog = combatLog.length > 0 ? combatLog[combatLog.length - 1] : null;

    return (
      <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
        <div className="bg-surface-container border-4 border-on-surface w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(31,28,11,1)] flex flex-col">
          <div className="bg-error p-3 border-b-4 border-on-surface flex justify-between items-center text-on-error relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] mix-blend-overlay"></div>
            <h2 className="font-headline text-2xl font-black uppercase tracking-tighter relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined">swords</span> COMBAT
            </h2>
            <span className="font-label font-bold relative z-10 text-sm">Turn {turn}</span>
          </div>

          <div className="p-6 grid grid-cols-2 gap-8 relative overflow-hidden">
            {/* Player Side */}
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-xl uppercase text-primary">Player</h3>
              <div className="h-24 bg-surface-variant border-2 border-outline flex items-center justify-center shadow-sm">
                <img
                  src={playerClass === 'mage' ? '/images/player_mage.png' : (playerClass === 'rogue' ? '/images/player_rogue.png' : '/images/player_knight.png')}
                  alt="player"
                  className="max-h-20 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase"><span>HP</span><span>{playerHp} / {playerMaxHp}</span></div>
                <div className="h-4 w-full bg-surface-container-highest border-2 border-on-surface">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold uppercase mt-2"><span>MP</span><span>{playerMana} / {playerMaxMana}</span></div>
                <div className="h-2 w-full bg-surface-container-highest border-2 border-on-surface">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.max(0, (playerMana / playerMaxMana) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase mt-1 text-outline">
                  <span>AD: {displayStats.ad}</span>
                  <span>Armor: {displayStats.armor}</span>
                </div>
              </div>
            </div>

            {/* VS badge */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-surface border-4 border-on-surface flex items-center justify-center shadow-lg z-10 rotate-12">
              <span className="font-headline font-black text-2xl italic text-error">VS</span>
            </div>

            {/* Monster Side */}
            <div className="space-y-4 text-right">
              <h3 className="font-headline font-bold text-xl uppercase text-error">{monsterName} <span className="text-sm font-body text-outline">Lv.{monsterLevel}</span></h3>
              <div className="h-24 bg-surface-variant border-2 border-outline flex items-center justify-center relative shadow-sm">
                <img
                  src={['mini_boss', 'big_boss'].includes(cellType)
                    ? "/images/skeleton_boss.png"
                    : (monsterLevel === 1 ? "/images/skeleton_lv1.png" : "/images/skeleton_lv2.png")
                  }
                  alt="monster"
                  className="max-h-20 object-contain"
                  style={{
                    mixBlendMode: 'multiply',
                    transform: ['mini_boss', 'big_boss'].includes(cellType) ? 'scaleX(-1)' : 'none'
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase flex-row-reverse"><span>HP</span><span>{monsterHp} / {monsterMaxHp}</span></div>
                <div className="h-4 w-full bg-surface-container-highest border-2 border-on-surface flex justify-end">
                  <div className="h-full bg-error transition-all duration-300" style={{ width: `${Math.max(0, (monsterHp / monsterMaxHp) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase mt-1 text-outline flex-row-reverse">
                  <span>AD: {monsterAd ?? 10}</span>
                  <span>Armor: {monsterArmor ?? 5}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-2 bg-surface-container-highest border-y-2 border-outline min-h-[60px] flex items-center justify-center">
            {lastLog ? (
              <p className="font-body text-sm font-medium text-center">
                {lastLog.action === 'defend' ? (
                  <>You took a defensive stance, <span className="font-bold text-orange-400">REDUCING DAMAGE</span> by 50% for the next attack.</>
                ) : lastLog.action === 'dodge' ? (
                  <>You prepared to <span className="font-bold text-purple-400">DODGE</span>, increasing your evasion chance for the next attack.</>
                ) : lastLog.action === 'spell' ? (
                  <>You cast a <span className="font-bold text-cyan-400">SPELL</span> and restored <span className="font-bold text-cyan-400">{lastLog.heal ?? 0} HP</span>.</>
                ) : lastLog.action === 'rest' ? (
                  <>You focused and <span className="font-bold text-blue-400">RESTED</span>, restoring <span className="font-bold text-blue-400">15 MP</span>.</>
                ) : lastLog.action === 'heal' ? (
                  <>You used <span className="font-bold text-emerald-400">HEAL (12MP)</span> and restored <span className="font-bold text-emerald-400">{lastLog.heal ?? 0} HP</span>.</>
                ) : lastLog.action === 'use_item' ? (
                  <>You used <span className="font-bold text-blue-300">{lastLog.itemName}</span> and restored {lastLog.heal > 0 && <span className="text-emerald-400">{lastLog.heal} HP</span>} {lastLog.heal > 0 && lastLog.manaRestored > 0 && 'and'} {lastLog.manaRestored > 0 && <span className="text-blue-400">{lastLog.manaRestored} MP</span>}.</>
                ) : (
                  <>
                    You used <span className="font-bold text-tertiary">{lastLog.action === 'heavy_attack' ? `HEAVY ATK (${manaCosts.heavyAtk}MP)` : `ATTACK (${manaCosts.normalAtk}MP)`}</span> for <span className="font-bold text-primary">{lastLog.playerDmg}</span> damage {lastLog.isCrit && <span className="text-secondary">(CRIT!)</span>}.
                  </>
                )}
                {' '}
                {lastLog.defendActive ? `Monster's damage was reduced!` : lastLog.monsterDmg > 0
                  ? `Monster counter-attacked for ${lastLog.monsterDmg}.`
                  : (lastLog.dodged ? 'You DODGED the counter-attack.' : '')}
              </p>
            ) : (
              <p className="font-body text-sm text-outline italic text-center">The battle begins! Choose your action.</p>
            )}
          </div>

          <div className="p-4 bg-surface-dim relative min-h-[140px]">
            {/* ── Main Category Selection ── */}
            {combatSubMenu === null && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                <button
                  onClick={() => setCombatSubMenu('atk')}
                  className="py-6 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest border-4 border-on-primary-container shadow-[4px_4px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
                  <span>COMBAT</span>
                </button>
                <button
                  onClick={() => setCombatSubMenu('item')}
                  className="py-6 bg-secondary text-on-secondary font-headline font-bold uppercase tracking-widest border-4 border-on-secondary-container shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  <span>USE ITEM</span>
                </button>
              </div>
            )}

            {/* ── COMBAT Sub-menu ── */}
            {combatSubMenu === 'atk' && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                <button
                  onClick={() => doCombatAction('attack')}
                  disabled={loading || (manaCosts.normalAtk > 0 && playerMana < manaCosts.normalAtk)}
                  className="py-4 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center disabled:opacity-50"
                >
                  <div className="text-xs">Normal ATK</div>
                  <span className="text-[10px] opacity-80">({manaCosts.normalAtk === 0 ? 'Free' : `${manaCosts.normalAtk} MP`})</span>
                </button>
                <button
                  onClick={() => doCombatAction('heavy_attack')}
                  disabled={loading || (manaCosts.heavyAtk > 0 && playerMana < manaCosts.heavyAtk)}
                  className="py-4 bg-secondary text-on-secondary font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center disabled:opacity-50"
                >
                  <div className="text-xs">Heavy ATK</div>
                  <span className="text-[10px] opacity-80">({manaCosts.heavyAtk === 0 ? 'Free' : `${manaCosts.heavyAtk} MP`})</span>
                </button>

                {/* ── Class-specific abilities ── */}
                {playerClass === 'warrior' && (
                  <button
                    onClick={() => doCombatAction('defend')}
                    disabled={loading}
                    className="py-4 bg-orange-700 text-orange-50 font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center"
                  >
                    <div className="text-xs">Defend</div>
                    <span className="text-[10px] opacity-80">(50% damage reduction)</span>
                  </button>
                )}

                {playerClass === 'rogue' && (
                  <button
                    onClick={() => doCombatAction('dodge')}
                    disabled={loading}
                    className="py-4 bg-purple-700 text-purple-50 font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center"
                  >
                    <div className="text-xs">Dodge</div>
                    <span className="text-[10px] opacity-80">(+60% dodge chance)</span>
                  </button>
                )}

                {playerClass === 'mage' && (
                  <button
                    onClick={() => doCombatAction('spell')}
                    disabled={loading || (manaCosts.spell > 0 && playerMana < manaCosts.spell)}
                    className="py-4 bg-cyan-700 text-cyan-50 font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center disabled:opacity-50"
                  >
                    <div className="text-xs">Spell</div>
                    <span className="text-[10px] opacity-80">(Heal 25% HP)</span>
                  </button>
                )}

                <button
                  onClick={() => doCombatAction('rest')}
                  disabled={loading}
                  className="py-4 bg-blue-600 text-blue-50 font-headline font-bold uppercase tracking-widest border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none flex flex-col items-center"
                >
                  <div className="text-xs">Rest</div>
                  <span className="text-[10px] opacity-80">(+{manaCosts.RestRestoresMP} MP)</span>
                </button>
                <button
                  onClick={() => setCombatSubMenu(null)}
                  className="col-span-2 py-1 text-[10px] font-bold uppercase text-outline underline"
                >
                  Back
                </button>
              </div>
            )}

            {/* ── ITEM Sub-menu ── */}
            {combatSubMenu === 'item' && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                {inventory.filter(ui => ui.item && ['potion', 'scroll'].includes(ui.item.type)).length === 0 ? (
                  <div className="col-span-2 text-center text-outline text-sm py-4">
                    No usable items in inventory
                  </div>
                ) : (
                  inventory.filter(ui => ui.item && ['potion', 'scroll'].includes(ui.item.type)).map((userItem) => (
                    <button
                      key={userItem._id}
                      onClick={() => doCombatAction('use_item', userItem._id)}
                      disabled={loading}
                      className="py-4 bg-blue-700 text-blue-50 font-headline font-bold uppercase tracking-widest border-2 border-blue-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex flex-col items-center disabled:opacity-50"
                    >
                      <div className="text-xs">{userItem.item.name}</div>
                      <span className="text-[10px] opacity-80">x{userItem.quantity}</span>
                    </button>
                  ))
                )}
                <button
                  onClick={() => setCombatSubMenu(null)}
                  className="col-span-2 py-1 text-[10px] font-bold uppercase text-outline underline"
                >
                  Back
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={() => doCombatAction('flee')}
                disabled={loading}
                className="w-full py-2 bg-surface-container-highest text-on-surface-variant font-headline font-bold uppercase tracking-widest border-2 border-outline/30 flex justify-center items-center gap-2 text-[10px] opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">directions_run</span> FLEE (END RUN)
              </button>
              <p className="text-[10px] text-outline uppercase text-center font-bold">Every dungeon action costs 1 turn.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLootModal = () => {
    if (!chestReward && !chestLoot) return null;

    let title = 'Chest Opened!';
    let displayContent = null;
    let borderColor = 'border-yellow-600';
    let titleColor = 'text-yellow-600';

    if (chestReward?.rewardType === 'gold') {
      title = 'Gold Found!';
      borderColor = 'border-yellow-500';
      titleColor = 'text-yellow-400';
      displayContent = (
        <>
          <span className="material-symbols-outlined text-6xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>
            paid
          </span>
          <p className="font-bold text-4xl text-yellow-400">{chestReward.goldEarned}G</p>
        </>
      );
    } else if (chestReward?.rewardType === 'ticket') {
      title = 'Tickets Found!';
      borderColor = 'border-blue-400';
      titleColor = 'text-blue-400';
      displayContent = (
        <>
          <span className="material-symbols-outlined text-6xl text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_offer
          </span>
          <p className="font-bold text-4xl text-blue-400">+{chestReward.ticketsEarned}</p>
          <p className="text-sm text-outline">Gacha Tickets</p>
        </>
      );
    } else if (chestLoot) {
      title = 'Item Found!';
      borderColor = 'border-amber-600';
      titleColor = 'text-amber-500';
      displayContent = (
        <>
          {chestLoot.item?.imageUrl ? (
            <img src={chestLoot.item.imageUrl} alt={chestLoot.item.name} className="w-20 h-20 object-contain mb-2" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-primary mb-2">construction</span>
          )}
          <p className="font-bold text-lg">{chestLoot.item?.name}</p>
          <p className="text-sm uppercase text-outline font-label">{chestLoot.item?.rarity}</p>
        </>
      );
    }

    return (
      <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
        <div className={`bg-surface-container border-4 ${borderColor} w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(113,90,0,1)] p-6 flex flex-col items-center text-center space-y-4`}>
          <h2 className={`font-headline text-2xl font-black uppercase ${titleColor}`}>{title}</h2>
          <div className="p-4 bg-surface w-full border-2 border-outline flex flex-col items-center">
            {displayContent}
          </div>
          <button
            onClick={() => {
              setChestLoot(null);
              setChestReward(null);
            }}
            className="w-full py-2 bg-primary text-on-primary font-bold uppercase border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            Claim
          </button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container overflow-hidden min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/maps/dungeon.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >

      <Navbar />

      {/* ── Toast message ── */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface px-6 py-3 font-headline text-sm uppercase tracking-widest shadow-lg border-2 border-primary animate-bounce">
          {message}
        </div>
      )}

      {/* ── Main ── */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(194,153,71,0.15) 0%, transparent 70%)' }} />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">

          {/* OVERLAYS */}
          {renderCombatModal()}
          {renderLootModal()}

          {/* ── Left Panel: Tactical HUD ── */}
          <section className="lg:col-span-3 space-y-6">
            <div className="bg-surface-container border-4 border-on-surface p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
              <h2 className="font-headline text-2xl font-extrabold uppercase tracking-tighter text-primary border-b-2 border-outline-variant mb-4">Tactical HUD</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-label text-xs uppercase text-outline">Location</span>
                  <span className="font-headline font-bold text-lg text-secondary">Floor {floor}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-label text-xs uppercase text-outline">Action Count</span>
                  <span className="font-headline font-bold text-xl text-primary">{turnCount}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-label text-xs uppercase text-outline">Turns</span>
                  <span className="font-headline font-bold text-xl text-secondary">{playerLevel?.turns ?? 0}</span>
                </div>
                {/* Level / EXP Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Lv.{playerLevel.level}</span>
                    <span>{playerLevel.exp} / {playerLevel.expToNextLevel} EXP</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest border-2 border-on-surface rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary transition-all duration-300" style={{ width: `${(playerLevel.exp / playerLevel.expToNextLevel) * 100}%` }} />
                  </div>
                </div>

                {/* Gold / Currency */}
                <div className="flex justify-between items-center mb-3 px-3 py-1.5 bg-surface-container-high border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-headline font-bold text-xs uppercase text-primary">Gold / Tiền</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-tertiary">payments</span>
                    <span className="font-bold text-sm tracking-tight">{playerLevel?.gold?.toLocaleString() ?? 0}</span>
                  </div>
                </div>

                {/* Tactical Stats */}
                <div className="grid grid-cols-2 gap-2 mt-2 font-label text-xs">
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-error font-bold uppercase">HP</span>
                    <span className="font-bold">{displayStats.hp}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-secondary font-bold uppercase">MP</span>
                    <span className="font-bold">{displayStats.mp}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-primary font-bold uppercase">AD</span>
                    <span className="font-bold">{displayStats.ad}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-tertiary font-bold uppercase">AP</span>
                    <span className="font-bold">{displayStats.ap}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-outline font-bold uppercase">Armor</span>
                    <span className="font-bold">{displayStats.armor}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline">
                    <span className="text-outline font-bold uppercase">MR</span>
                    <span className="font-bold">{displayStats.mr}</span>
                  </div>
                  <div className="flex justify-between bg-surface-variant px-2 py-1 border border-outline col-span-2">
                    <span className="text-primary-container font-bold uppercase">Backpack</span>
                    <span className="font-bold">{run?.lootCollected?.length ?? 0} / {playerLevel?.maxBackpackSlots || 5}</span>
                  </div>
                </div>

                {/* Stat Allocation */}
                <div className="mt-3 p-2 border-2 border-outline bg-surface-container-high">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-headline text-[10px] uppercase text-outline">Unspent Points</span>
                    <span className="font-bold text-primary">{playerLevel?.statPoints ?? 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {['hp', 'mp', 'ad', 'ap', 'armor', 'mr'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => allocateStatPoint(key)}
                        disabled={(playerLevel?.statPoints ?? 0) <= 0 || Boolean(allocatingStat)}
                        className="py-1 px-1 text-[10px] uppercase font-bold border border-outline bg-surface-variant hover:bg-primary hover:text-on-primary disabled:opacity-40"
                      >
                        + {key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start / Abandon run buttons */}
                {!run ? (
                  <button
                    onClick={startRun}
                    disabled={loading}
                    className="w-full mt-4 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest py-2 border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : 'Enter Dungeon'}
                  </button>
                ) : (
                  <button
                    onClick={abandonRun}
                    disabled={loading}
                    className="w-full mt-2 text-xs text-error font-bold uppercase hover:underline disabled:opacity-50"
                  >
                    Abandon Run
                  </button>
                )}
              </div>
            </div>

            {/* Chronicle narration */}
            <div className="bg-tertiary text-on-tertiary border-4 border-on-surface p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
              <h3 className="font-label text-xs uppercase mb-2 text-surface-container-high opacity-80">Chronicle Entry</h3>
              <p className="font-body text-sm italic leading-relaxed">{log}</p>
            </div>
          </section>

          {/* ── Center: 5×5 Grid ── */}
          <section className="lg:col-span-6 flex flex-col items-center">
            <div className="bg-on-surface p-2 border-x-4 border-t-4 border-primary shadow-xl">
              <div className="grid grid-cols-5 gap-1 bg-on-surface">
                {grid.map((rowArr, ri) =>
                  rowArr.map((cellType, ci) => {
                    // Only show True cellType if fog is lifted (visited) OR if no run is active (demo)
                    const isVis = run ? visited.has(`${ri}-${ci}`) : (cellType !== 'wall' && cellType !== 'empty');
                    return (
                      <GridCell
                        key={`${ri}-${ci}`}
                        type={cellType}
                        isPlayer={run && ri === playerX && ci === playerY}
                        isVisible={isVis}
                        playerClass={playerClass}
                      />
                    )
                  })
                )}
              </div>
            </div>
            <div className="w-full h-4 bg-on-surface shadow-[0px_8px_16px_rgba(0,0,0,0.5)]" />
            <p className="text-xs text-outline italic mt-2 font-label">Use arrow keys to move</p>
          </section>

          {/* ── Right Panel: Controls & Context Actions ── */}
          <section className="lg:col-span-3 space-y-6">

            {/* Action Context Menu */}
            {run && (
              <div className="bg-surface-container border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
                <h3 className="font-headline text-lg font-bold uppercase text-primary border-b-2 border-outline-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">touch_app</span> Actions
                </h3>
                <div className="space-y-3">
                  {showEngage ? (
                    <button onClick={startCombat} disabled={loading} className="w-full py-3 bg-error text-on-error font-bold tracking-wider uppercase border-2 border-on-surface flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span> ENGAGE
                    </button>
                  ) : showChestBtn ? (
                    <button onClick={doOpenChest} disabled={loading} className="w-full py-3 bg-yellow-600 text-yellow-50 font-bold tracking-wider uppercase border-2 border-on-surface flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span> OPEN CHEST
                    </button>
                  ) : showExitBtn ? (
                    <button onClick={doNextFloor} disabled={loading} className="w-full py-3 bg-green-700 text-green-50 font-bold tracking-wider uppercase border-2 border-on-surface flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>door_open</span> NEXT FLOOR
                    </button>
                  ) : (
                    <div className="py-3 bg-surface-variant text-outline border-2 border-dashed border-outline-variant text-center font-label italic text-sm">
                      No actions available here.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* D-Pad */}
            <div className="bg-surface-container border-4 border-on-surface p-4 flex flex-col items-center">
              <span className="font-label text-xs uppercase text-outline mb-4">Navigation</span>
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button onClick={() => move('up')} className="w-14 h-14 bg-surface-variant text-on-surface border-2 border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">arrow_upward</span>
                </button>
                <div />
                <button onClick={() => move('left')} className="w-14 h-14 bg-surface-variant text-on-surface border-2 border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="w-14 h-14 bg-surface border-2 border-dashed border-outline opacity-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">circle</span>
                </div>
                <button onClick={() => move('right')} className="w-14 h-14 bg-surface-variant text-on-surface border-2 border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <div />
                <button onClick={() => move('down')} className="w-14 h-14 bg-surface-variant text-on-surface border-2 border-outline shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined">arrow_downward</span>
                </button>
                <div />
              </div>
            </div>

          </section>
        </div>
      </main>

      {/* ── Mobile nav ── */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-on-surface text-surface border-t-4 border-primary">
        <div className="flex justify-around items-stretch">
          {[
            { icon: 'auto_stories', label: 'Grimoire', to: '/grimoire' },
            { icon: 'psychology', label: 'Aptitude', to: '/aptitude' },
            { icon: 'castle', label: 'Dungeon', to: '/dungeon', active: true },
            { icon: 'shield', label: 'Armory', to: '/armory' },
            { icon: 'storefront', label: 'Shop', to: '/shop' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center p-3 text-[10px] font-headline font-bold uppercase transition-all
                ${item.active ? 'bg-primary text-on-primary w-20' : 'opacity-70 hover:opacity-100 hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined text-2xl mb-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
