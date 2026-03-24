import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

// ── Sub-components ───────────────────────────────────────────

function HudBar() {
  const [stats, setStats] = useState({ turns: 0, gold: 0, tickets: 0 });

  useEffect(() => {
    // Attempt rapid optimistic load from cache
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (cachedUser.dungeonMoves !== undefined) {
      setStats({ turns: cachedUser.dungeonMoves || 0, gold: cachedUser.gold || 0, tickets: cachedUser.ticketCount || 0 });
    }
    
    // Fetch live ground truth
    api.get('/api/users/me').then(res => {
      const user = res.data;
      setStats({ turns: user.dungeonMoves || 0, gold: user.gold || 0, tickets: user.ticketCount || 0 });
      // Sync cache
      localStorage.setItem('user', JSON.stringify({ ...cachedUser, ...user }));
    }).catch(err => console.error("HUD sync failed:", err));
  }, []);

  return (
    <div className="w-full bg-stone-950 px-6 py-3 flex justify-center gap-12 border-b-2 border-stone-800">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>directions_walk</span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-tighter">Turns</span>
          <span className="text-lg font-headline font-bold text-surface-container-high leading-none">{stats.turns.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>generating_tokens</span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-tighter">Gold</span>
          <span className="text-lg font-headline font-bold text-surface-container-high leading-none">{stats.gold.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-tighter">Tickets</span>
          <span className="text-lg font-headline font-bold text-surface-container-high leading-none">{stats.tickets.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function MyDeckCard({ set, onStudy, featured }) {
  const cardCount = set.cards?.length ?? set.cardCount ?? 0;
  const progress  = set.progress ?? 0;

  // Determine status
  let statusLabel, statusColor, btnLabel;
  if (progress === 0) {
    statusLabel = 'Not Started'; statusColor = 'text-stone-500'; btnLabel = 'Study';
  } else if (progress < 100) {
    statusLabel = `${progress}% Mastered`; statusColor = 'text-yellow-400'; btnLabel = 'Continue';
  } else {
    statusLabel = '100% Mastered'; statusColor = 'text-tertiary'; btnLabel = 'Review';
  }

  if (featured) {
    return (
      <div className="md:col-span-2 lg:col-span-1 bg-surface-container-high p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)] relative border-2 border-primary-container overflow-hidden">
        <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
          <span className="material-symbols-outlined text-[120px]">castle</span>
        </div>
        <div className="mb-6 relative z-10">
          <span className="text-xs font-bold uppercase text-primary tracking-widest mb-1 block">Mastery Track</span>
          <h3 className="font-headline text-2xl font-black text-on-surface">{set.title}</h3>
          <div className="w-full bg-surface-variant h-2 mt-4 border border-outline/30">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className={`text-xs mt-2 italic font-bold ${statusColor}`}>{statusLabel}</p>
        </div>
        <div className="flex items-center justify-between mt-8 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-outline tracking-tighter">Capacity</span>
            <span className="font-bold text-on-surface">{cardCount} Scrolls</span>
          </div>
          <button onClick={() => onStudy(set)} className="bg-primary text-on-primary px-8 py-2 font-headline font-bold text-lg hover:bg-primary-container transition-colors active:scale-95">{btnLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)] relative border border-outline/20 flex flex-col">
      <div className="absolute -top-2 -right-2 bg-primary w-10 h-10 flex items-center justify-center text-on-primary shadow-md">
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
      </div>
      <div className="mb-4 flex-grow">
        <span className="text-xs font-bold uppercase text-outline tracking-widest mb-1 block">{set.description || 'Flashcard Set'}</span>
        <h3 className="font-headline text-2xl font-black text-on-surface">{set.title}</h3>
        <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 italic">{set.description}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>{statusLabel}</span>
          <span className="text-[10px] font-bold text-stone-500">{cardCount} Scrolls</span>
        </div>
        <div className="w-full bg-stone-800 h-1.5">
          <div
            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-tertiary' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button onClick={() => onStudy(set)} className="w-full bg-primary text-on-primary py-2 font-headline font-bold text-lg hover:bg-primary-container transition-colors active:scale-95">{btnLabel}</button>
    </div>
  );
}

function PublicDeckRow({ set, onAcquire }) {
  const ICONS = { history_edu: 'history_edu', shield_moon: 'shield_moon', psychology: 'psychology', auto_stories: 'auto_stories' };
  const icon  = set.icon || 'auto_stories';
  return (
    <div className="group flex flex-col md:flex-row items-center bg-stone-800/50 border-l-4 border-stone-600 p-4 hover:bg-stone-800 transition-colors">
      <div className="w-16 h-16 bg-stone-700 flex items-center justify-center shrink-0 mb-4 md:mb-0">
        <span className="material-symbols-outlined text-3xl text-stone-400">{icon}</span>
      </div>
      <div className="md:ml-6 flex-grow">
        <h4 className="font-headline text-xl text-stone-100 group-hover:text-primary-container transition-colors">{set.title}</h4>
        <p className="text-sm text-stone-500 italic">{set.description}</p>
        <div className="flex gap-4 mt-2">
          <span className="text-[10px] font-bold uppercase text-stone-600">{(set.studiedCount ?? 0).toLocaleString()} Study Sessions</span>
          <span className="text-[10px] font-bold uppercase text-stone-600">{(set.cards?.length ?? 0)} Scrolls</span>
        </div>
      </div>
      <div className="shrink-0 mt-4 md:mt-0">
        <button onClick={() => onAcquire(set)} className="px-6 py-2 border-2 border-stone-600 text-stone-300 font-label uppercase text-xs font-bold hover:bg-stone-700 hover:text-white transition-all active:scale-95">Acquire</button>
      </div>
    </div>
  );
}

// ── Create Set Modal ─────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards]       = useState(Array.from({ length: 20 }, () => ({ term: '', definition: '' })));
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function addCard() { setCards(c => [...c, { term: '', definition: '' }]); }
  function updateCard(i, field, val) {
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: val } : card));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Must be logged in to create a grimoire
    if (!localStorage.getItem('token')) {
      setError('You must be logged in to inscribe a Grimoire.');
      return;
    }
    if (!title.trim()) return setError('Title is required');
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 20) return setError(`At least 20 complete cards are required (you have ${validCards.length}).`);
    setLoading(true);
    try {
      await api.post('/api/grimoire', { title, description: desc, isPublic, cards: validCards });
      onCreate();
      onClose();
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired — please log in again.');
      } else {
        setError(err.response?.data?.error || 'Failed to create grimoire');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-surface border-4 border-primary w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-extrabold text-primary uppercase">Inscribe New Grimoire</h2>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface">close</button>
        </div>
        {error && <div className="bg-error-container text-on-error-container p-3 mb-4 border-l-4 border-error text-sm font-bold">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-outline tracking-widest mb-1">Title</label>
            <input className="w-full border-b-2 border-outline bg-transparent py-2 focus:border-primary outline-none font-body text-lg" placeholder="Runes of Oakhaven" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-outline tracking-widest mb-1">Description</label>
            <input className="w-full border-b-2 border-outline bg-transparent py-2 focus:border-primary outline-none font-body" placeholder="A brief lore entry..." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="public" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="public" className="text-sm text-on-surface-variant">Make public (visible in Realm Knowledge)</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase text-outline tracking-widest">Scrolls (Cards)</label>
                {(() => {
                  const filled = cards.filter(c => c.term.trim() && c.definition.trim()).length;
                  const ok = filled >= 20;
                  return (
                    <span className={`text-xs font-bold px-2 py-0.5 ${ok ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-stone-700 text-yellow-400'}`}>
                      {filled} / 20 {!ok && '⚠'}
                    </span>
                  );
                })()}
              </div>
              <button type="button" onClick={addCard} className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:opacity-70">
                <span className="material-symbols-outlined text-sm">add</span> Add Card
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cards.map((card, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <input className="border-b border-outline bg-transparent py-1 focus:border-primary outline-none text-sm font-body" placeholder={`Term ${i + 1}`} value={card.term} onChange={e => updateCard(i, 'term', e.target.value)} />
                  <input className="border-b border-outline bg-transparent py-1 focus:border-primary outline-none text-sm font-body" placeholder={`Definition ${i + 1}`} value={card.definition} onChange={e => updateCard(i, 'definition', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-primary-container transition-colors active:translate-y-1 disabled:opacity-50">
            {loading ? 'Inscribing...' : 'Inscribe Grimoire'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Static fallback data ─────────────────────────────────────
const DEMO_MY_SETS = [
  { _id: 'd1', title: 'Runes of Oakhaven',  description: 'Ancient Languages · A collection of glyphs found in the deep woods of the eastern reach.', cards: Array(42) },
  { _id: 'd2', title: 'Toxicology II',       description: 'Alchemical Formulas · Essential compounds for neutralizing serpent venoms and shadow rot.',  cards: Array(18) },
  { _id: 'd3', title: 'Siege Tactics',       description: 'Mastery Track',  cards: Array(112), progress: 65, featured: true },
];
const DEMO_PUBLIC = [
  { _id: 'p1', title: 'Chronicles of the First Age',  description: 'Authored by Arch-Maester Valerius. Covers the fall of the floating citadels.', studiedCount: 342, cards: Array(890), icon: 'history_edu' },
  { _id: 'p2', title: 'Nocturnal Bestiary',            description: 'Weaknesses and hunting patterns of beasts that prowl beneath the silver moon.',   studiedCount: 1200, cards: Array(245), icon: 'shield_moon' },
  { _id: 'p3', title: "The Mind Thief's Cipher",       description: 'Decoding the secret communications of the Silent Brotherhood.',                    studiedCount: 156, cards: Array(56),  icon: 'psychology' },
];

// ── Page ─────────────────────────────────────────────────────
export default function Grimoire() {
  const [mySets,     setMySets]     = useState([]);
  const [publicSets, setPublicSets] = useState([]);
  const [filter,     setFilter]     = useState('popular');
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();

  useEffect(() => { fetchSets(); }, []);

  async function fetchSets() {
    setLoading(true);
    
    // Fetch user sets independently
    if (user) {
      try {
        const myRes = await api.get('/api/grimoire/my');
        setMySets(myRes.data.sets || []);
      } catch (err) {
        console.error("Failed to load personal sets", err);
      }
    }
    
    // Fetch public sets independently
    try {
      const res = await api.get('/api/grimoire?limit=50');
      if (res.data.sets?.length > 0) {
        // Only show public sets not created by the current user
        const others = res.data.sets.filter(s => !user || String(s.creatorId) !== String(user._id));
        setPublicSets(others);
      }
    } catch (err) {
      console.error("Failed to load realm knowledge", err);
    } 
    
    setLoading(false);
  }

  function handleStudy(set) {
    navigate(`/grimoire/${set._id}/study`);
  }

  async function handleAcquire(set) {
    if (!user) return alert('You must log in to acquire scrolls.');
    try {
      await api.post(`/api/grimoire/${set._id}/acquire`);
      fetchSets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to acquire.');
    }
  }

  const filteredPublic = filter === 'legendary'
    ? [...publicSets].sort((a, b) => (b.cards?.length ?? 0) - (a.cards?.length ?? 0))
    : [...publicSets].sort((a, b) => (b.studiedCount ?? 0) - (a.studiedCount ?? 0));

  return (
    <div className="bg-stone-900 font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Navbar />
      <HudBar />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Page header */}
        <div className="mb-16">
          <h1 className="font-headline text-5xl font-extrabold text-surface-container-high mb-2">The Grimoire</h1>
          <p className="text-stone-400 max-w-2xl font-body italic">"Master the scrolls of old. Every sigil memorized is a blade sharpened against the void."</p>
        </div>

        {/* My Grimoires */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8 border-b-2 border-primary/20 pb-2">
            <h2 className="font-headline text-3xl font-bold text-primary-container">My Grimoires</h2>
            <button onClick={() => setShowModal(true)} className="text-primary-container flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="font-label uppercase text-sm font-bold tracking-widest">Inscribe New</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mySets.map((set, i) => (
              <MyDeckCard
                key={set._id}
                set={set}
                onStudy={handleStudy}
                featured={set.featured || i === mySets.length - 1}
              />
            ))}
          </div>
        </section>

        {/* Realm Knowledge */}
        <section>
          <div className="flex items-end justify-between mb-8 border-b-2 border-tertiary/20 pb-2">
            <h2 className="font-headline text-3xl font-bold text-tertiary-fixed-dim">Realm Knowledge</h2>
            <div className="flex gap-4">
              <span className="text-stone-500 font-label text-xs uppercase self-center">Filter by:</span>
              <button
                onClick={() => setFilter('popular')}
                className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${filter === 'popular' ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'border border-stone-700 text-stone-400 hover:bg-stone-800'}`}
              >Popular</button>
              <button
                onClick={() => setFilter('legendary')}
                className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${filter === 'legendary' ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'border border-stone-700 text-stone-400 hover:bg-stone-800'}`}
              >Legendary</button>
            </div>
          </div>
          <div className="space-y-4">
            {filteredPublic.map(set => (
              <PublicDeckRow key={set._id} set={set} onAcquire={handleAcquire} />
            ))}
          </div>
        </section>
      </main>

      {/* FAB — Inscribe New */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => setShowModal(true)}
          className="w-16 h-16 bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:bg-primary-container active:translate-y-1 transition-all"
          style={{ boxShadow: 'inset 2px 2px 0px 0px #ffdea5, inset -2px -2px 0px 0px #483200, 4px 4px 0px 0px rgba(0,0,0,1)' }}
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>ink_pen</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={fetchSets} />}
    </div>
  );
}
