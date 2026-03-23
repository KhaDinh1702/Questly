import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

// ── Cell type helpers ────────────────────────────────────────
const CELL_ICONS = {
  empty:     { icon: null,           bg: 'bg-stone-700 border-stone-600', opacity: '' },
  wall:      { icon: 'close',        bg: 'bg-stone-800',                   opacity: 'opacity-20' },
  start:     { icon: 'flag',         bg: 'bg-stone-700 border-stone-600', opacity: '' },
  exit:      { icon: 'door_open',    bg: 'bg-green-900 border-green-600', opacity: '' },
  monster:   { icon: 'skull',        bg: 'bg-stone-700 border-stone-600', opacity: '' },
  mini_boss: { icon: 'skull',        bg: 'bg-red-950 border-red-800',     opacity: '' },
  big_boss:  { icon: 'skull',        bg: 'bg-purple-950 border-purple-800', opacity: '' },
  cleared:   { icon: 'check_circle', bg: 'bg-stone-900 border-stone-700', opacity: 'opacity-40' },
}

function GridCell({ type, isPlayer }) {
  const cfg = CELL_ICONS[type] || CELL_ICONS.wall;
  const iconColor =
    type === 'monster'   ? 'text-red-400' :
    type === 'mini_boss' ? 'text-orange-400' :
    type === 'big_boss'  ? 'text-purple-400' :
    type === 'exit'      ? 'text-green-400' :
    type === 'cleared'   ? 'text-stone-600' : 'text-stone-600';

  return (
    <div
      className={`w-16 h-16 md:w-20 md:h-20 border-2 flex items-center justify-center relative
        ${cfg.bg} ${cfg.opacity}
        ${isPlayer ? 'border-4 border-primary' : ''}
      `}
    >
      {isPlayer && (
        <>
          <div className="absolute inset-0 bg-primary opacity-10 animate-pulse" />
          <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
        </>
      )}
      {!isPlayer && cfg.icon && (
        <span
          className={`material-symbols-outlined ${iconColor}`}
          style={type === 'monster' || type === 'mini_boss' || type === 'big_boss'
            ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {cfg.icon}
        </span>
      )}
      {/* treasure chest */}
      {!isPlayer && type === 'empty' && false && (
        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
          inventory_2
        </span>
      )}
    </div>
  );
}

// ── Static 5×5 demo grid (used before a real run is loaded) ───
const DEFAULT_GRID = [
  ['wall',    'wall',    'monster', 'wall',  'wall'   ],
  ['empty',   'empty',   'empty',   'empty', 'wall'   ],
  ['empty',   'empty',   'empty',   'empty', 'empty'  ],
  ['wall',    'empty',   'empty',   'empty', 'wall'   ],
  ['wall',    'wall',    'empty',   'wall',  'exit'   ],
]

// ── Dungeon Page ─────────────────────────────────────────────
export default function Dungeon() {

  // ── State ─────────────────────────────────────────────────
  const [run, setRun]             = useState(null);
  const [grid, setGrid]           = useState(DEFAULT_GRID);
  const [playerX, setPlayerX]     = useState(2);
  const [playerY, setPlayerY]     = useState(2);
  const [stepsLeft, setStepsLeft] = useState(12);
  const [hp, setHp]               = useState({ cur: 84, max: 100 });
  const [mana, setMana]           = useState({ cur: 42, max: 60 });
  const [floor, setFloor]         = useState(1);
  const [log, setLog]             = useState('"The air grows heavy with the scent of damp moss and iron. To the east, a faint metallic scraping persists."');
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState('');

  // ── Load active run on mount ───────────────────────────────
  useEffect(() => {
    fetchActiveRun();
  }, []);

  async function fetchActiveRun() {
    if (!localStorage.getItem('token')) return; // not logged in — show demo grid
    try {
      const res = await api.get('/api/dungeon/active');
      applyRun(res.data);
    } catch {
      // no active run yet — show demo grid
    }
  }

  function applyRun(data) {
    setRun(data);
    setGrid(data.grid);
    setPlayerX(data.currentX);
    setPlayerY(data.currentY);
    setFloor(data.floor);
  }

  // ── Start a new run ────────────────────────────────────────
  async function startRun() {
    setLoading(true);
    try {
      const res = await api.post('/api/dungeon/start', { floor });
      applyRun(res.data.run);
      flash('Dungeon run started! Good luck, adventurer.');
    } catch (e) {
      flash(e.response?.data?.error || 'Failed to start run', true);
    } finally {
      setLoading(false);
    }
  }

  // ── Move ──────────────────────────────────────────────────
  const DIR_MAP = { up: 'up', down: 'down', left: 'left', right: 'right' };

  async function move(dir) {
    if (stepsLeft <= 0) return flash('No steps remaining!', true);
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post('/api/dungeon/move', { direction: DIR_MAP[dir] });
      const { cell, position } = res.data;
      setPlayerX(position.x);
      setPlayerY(position.y);
      setStepsLeft(s => s - 1);

      if (cell === 'monster')   flash('⚔️ A monster lurks here! Press [Attack] to engage.');
      else if (cell === 'mini_boss') flash('💀 A Mini-Boss blocks the path!');
      else if (cell === 'big_boss')  flash('👹 THE BOSS AWAKENS! Prepare yourself!');
      else if (cell === 'exit')      flash('🚪 You found the exit! Continue to next floor?');
      else flash('You move deeper into the darkness...');
    } catch (e) {
      flash(e.response?.data?.error || 'Cannot move there', true);
    } finally {
      setLoading(false);
    }
  }

  // ── Keyboard controls ─────────────────────────────────────
  const handleKey = useCallback((e) => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                  w: 'up', s: 'down', a: 'left', d: 'right' };
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
  }, [stepsLeft, loading]); // eslint-disable-line

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function flash(msg, isError = false) {
    setLog(isError ? `⚠️ ${msg}` : `"${msg}"`);
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container overflow-hidden min-h-screen flex flex-col">

      <Navbar />

      {/* ── Toast message ── */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-on-surface text-surface px-6 py-3 font-headline text-sm uppercase tracking-widest shadow-lg border-2 border-primary animate-bounce">
          {message}
        </div>
      )}

      {/* ── Main ── */}
      <main className="relative flex-1 w-full flex flex-col items-center justify-center p-4 bg-surface-dim">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(194,153,71,0.15) 0%, transparent 70%)' }} />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">

          {/* ── Left Panel: Tactical HUD ── */}
          <section className="lg:col-span-3 space-y-6">
            <div className="bg-surface-container border-4 border-on-surface p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
              <h2 className="font-headline text-2xl font-extrabold uppercase tracking-tighter text-primary border-b-2 border-outline-variant mb-4">Tactical HUD</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-label text-xs uppercase text-outline">Location</span>
                  <span className="font-headline font-bold text-lg">Floor {floor}</span>
                </div>
                {/* HP Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Vitality</span>
                    <span>{hp.cur} / {hp.max}</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest border-2 border-on-surface">
                    <div className="h-full bg-error transition-all duration-300" style={{ width: `${(hp.cur / hp.max) * 100}%` }} />
                  </div>
                </div>
                {/* Mana Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Essence</span>
                    <span>{mana.cur} / {mana.max}</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest border-2 border-on-surface">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(mana.cur / mana.max) * 100}%` }} />
                  </div>
                </div>
                {/* Start run button */}
                {!run && (
                  <button
                    onClick={startRun}
                    disabled={loading}
                    className="w-full mt-4 bg-primary text-on-primary font-headline font-bold uppercase tracking-widest py-2 border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : 'Enter Dungeon'}
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
                {grid.map((row, ri) =>
                  row.map((cell, ci) => (
                    <GridCell
                      key={`${ri}-${ci}`}
                      type={cell}
                      isPlayer={ri === playerX && ci === playerY}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="w-full h-4 bg-on-surface shadow-[0px_8px_16px_rgba(0,0,0,0.5)]" />
            <p className="text-xs text-outline italic mt-2 font-label">WASD or arrow keys to move</p>
          </section>

          {/* ── Right Panel: Controls & Inventory ── */}
          <section className="lg:col-span-3 space-y-6">
            {/* Steps + D-Pad */}
            <div className="bg-surface-container border-4 border-on-surface p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] flex flex-col items-center">
              <div className="text-center mb-6">
                <span className="font-label text-xs uppercase text-outline">Exertion</span>
                <div className="text-4xl font-headline font-black text-primary tracking-widest">{stepsLeft}</div>
                <span className="font-label text-[10px] uppercase font-bold">Steps Remaining</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button onClick={() => move('up')}   className="w-12 h-12 bg-primary text-on-primary border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">arrow_upward</span>
                </button>
                <div />
                <button onClick={() => move('left')} className="w-12 h-12 bg-primary text-on-primary border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                {/* Attack button */}
                <button className="w-12 h-12 bg-tertiary text-on-tertiary border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(31,28,11,1)] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
                </button>
                <button onClick={() => move('right')} className="w-12 h-12 bg-primary text-on-primary border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <div />
                <button onClick={() => move('down')} className="w-12 h-12 bg-primary text-on-primary border-2 border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">arrow_downward</span>
                </button>
                <div />
              </div>
            </div>

            {/* Inventory quick-bar */}
            <div className="bg-surface-container-high border-4 border-on-surface p-4 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
              <h3 className="font-headline text-lg font-bold uppercase text-primary-container border-b-2 border-outline-variant mb-3">Inventory Quick-Bar</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="aspect-square bg-surface-variant border-2 border-outline flex items-center justify-center relative cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>ecg_heart</span>
                  <span className="absolute bottom-0 right-0 text-[10px] font-bold bg-on-surface text-surface px-1">2</span>
                </div>
                <div className="aspect-square bg-surface-variant border-2 border-outline flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>vital_signs</span>
                </div>
                <div className="aspect-square bg-surface-variant border-2 border-outline flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-tertiary">key</span>
                </div>
                <div className="aspect-square bg-surface-container-highest border-2 border-outline-variant flex items-center justify-center opacity-40">
                  <span className="material-symbols-outlined text-outline">add</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Mobile nav ── */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-stretch bg-stone-100 border-t-4 border-stone-800 shadow-[0_-4px_0px_0px_rgba(31,28,11,1)]">
        {[
          { icon: 'auto_stories', label: 'Grimoire', to: '/grimoire' },
          { icon: 'psychology',   label: 'Aptitude', to: '/aptitude' },
          { icon: 'castle',       label: 'Dungeon',  to: '/dungeon',  active: true },
          { icon: 'shield',       label: 'Armory',   to: '/armory'  },
          { icon: 'storefront',   label: 'Shop',     to: '/shop'    },
        ].map(item => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center justify-center p-3 text-xs font-serif font-bold uppercase transition-all
              ${item.active ? 'bg-yellow-800 text-orange-50 border-x-2 border-yellow-600' : 'text-stone-500 hover:bg-stone-200'}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </footer>
    </div>
  );
}
