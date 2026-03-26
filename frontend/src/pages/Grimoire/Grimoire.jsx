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

function MyDeckCard({ set, onStudy, onDelete, onEdit, featured }) {
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
          <div className="flex gap-2">
            {!set.acquired && (
              <button onClick={() => onEdit(set)} className="bg-stone-800 text-stone-300 px-3 py-2 border-2 border-stone-700 hover:bg-stone-700 hover:text-white transition-all active:scale-95">
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
            )}
            <button onClick={() => onDelete(set)} className="bg-stone-800 text-error px-3 py-2 border-2 border-stone-700 hover:bg-error-container hover:text-on-error-container transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
            <button onClick={() => onStudy(set)} className="bg-primary text-on-primary px-8 py-2 font-headline font-bold text-lg hover:bg-primary-container transition-colors active:scale-95">{btnLabel}</button>
          </div>
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

      <div className="flex gap-2">
        {!set.acquired && (
          <button onClick={() => onEdit(set)} className="bg-stone-800 text-stone-300 px-3 py-2 border-2 border-stone-700 hover:bg-stone-700 hover:text-white transition-all active:scale-95">
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        )}
        <button onClick={() => onDelete(set)} className="bg-stone-800 text-error px-4 py-2 border-2 border-stone-700 hover:bg-error-container hover:text-on-error-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
        <button onClick={() => onStudy(set)} className="flex-grow bg-primary text-on-primary py-2 font-headline font-bold text-lg hover:bg-primary-container transition-colors active:scale-95">{btnLabel}</button>
      </div>
    </div>
  );
}

function PublicDeckRow({ set, onAcquire, onPreview, onVote, user }) {
  const ICONS = { history_edu: 'history_edu', shield_moon: 'shield_moon', psychology: 'psychology', auto_stories: 'auto_stories' };
  const icon  = set.icon || 'auto_stories';
  const upvotes = set.upvotes || [];
  const hasVoted = user && upvotes.some(id => String(id) === String(user._id));
  const voteCount = upvotes.length;

  return (
    <div className="group flex flex-col md:flex-row items-center bg-stone-800/50 border-l-4 border-stone-600 p-4 hover:bg-stone-800 transition-colors">
      <div className="w-16 h-16 bg-stone-700 flex items-center justify-center shrink-0 mb-4 md:mb-0">
        <span className="material-symbols-outlined text-3xl text-stone-400">{icon}</span>
      </div>
      <div className="md:ml-6 flex-grow">
        <h4 className="font-headline text-xl text-stone-100 group-hover:text-primary-container transition-colors">{set.title}</h4>
        <p className="text-sm text-stone-500 italic">{set.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[10px] font-bold uppercase text-stone-600">{(set.studiedCount ?? 0).toLocaleString()} Study Sessions</span>
          <span className="text-[10px] font-bold uppercase text-stone-600">{(set.cardCount ?? set.cards?.length ?? 0)} Scrolls</span>
          
          <button 
            onClick={() => onVote(set)}
            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors px-2 py-0.5 border rounded-full ${hasVoted ? 'text-primary border-primary/50 bg-primary/10' : 'text-stone-500 border-stone-600 hover:border-stone-400 hover:text-stone-300'}`}
          >
            <span className="material-symbols-outlined text-sm" style={hasVoted ? { fontVariationSettings: "'FILL' 1" } : {}}>
              thumb_up
            </span>
            {voteCount}
          </button>
        </div>
      </div>
      <div className="shrink-0 mt-4 md:mt-0 flex gap-2">
        <button onClick={() => onPreview(set)} className="w-10 h-10 flex items-center justify-center border-2 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white transition-all active:scale-95" title="Preview Scrolls">
          <span className="material-symbols-outlined text-xl">visibility</span>
        </button>
        <button onClick={() => onAcquire(set)} className="px-6 h-10 border-2 border-stone-600 text-stone-300 font-label uppercase text-xs font-bold hover:bg-stone-700 hover:text-white transition-all active:scale-95">Acquire</button>
      </div>
    </div>
  );
}

// ── Create/Edit Set Modal ──────────────────────────────────────
function SetModal({ onClose, onSave, initialSet }) {
  const isEdit = !!initialSet;
  const [title, setTitle]       = useState(initialSet?.title || '');
  const [desc, setDesc]         = useState(initialSet?.description || '');
  const [isPublic, setIsPublic] = useState(initialSet?.isPublic ?? true);
  const [cards, setCards]       = useState(
    initialSet?.cards && initialSet.cards.length >= 20 
      ? [...initialSet.cards] 
      : Array.from({ length: Math.max(20, initialSet?.cards?.length || 20) }, (_, i) => initialSet?.cards?.[i] || { term: '', definition: '' })
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function addCard() { setCards(c => [...c, { term: '', definition: '' }]); }
  function updateCard(i, field, val) {
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: val } : card));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Must be logged in to create or edit a grimoire
    if (!localStorage.getItem('token')) {
      setError('You must be logged in to inscribe a Grimoire.');
      return;
    }
    if (!title.trim()) return setError('Title is required');
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 20) return setError(`At least 20 complete cards are required (you have ${validCards.length}).`);
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/grimoire/${initialSet._id}`, { title, description: desc, isPublic, cards: validCards });
      } else {
        await api.post('/api/grimoire', { title, description: desc, isPublic, cards: validCards });
      }
      onSave();
      onClose();
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Session expired — please log in again.');
      } else {
        setError(err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} grimoire`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-surface border-4 border-primary w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-3xl font-extrabold text-primary uppercase">
            {isEdit ? 'Edit Grimoire' : 'Inscribe New Grimoire'}
          </h2>
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
            {loading ? (isEdit ? 'Saving...' : 'Inscribing...') : (isEdit ? 'Save Changes' : 'Inscribe Grimoire')}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Preview Modal ────────────────────────────────────────────
function PreviewModal({ setId, onClose, onAcquire }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/grimoire/${setId}`).then(res => {
      setData(res.data);
    }).catch(err => {
      setError(err.response?.data?.error || 'Failed to load preview');
    }).finally(() => {
      setLoading(false);
    });
  }, [setId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-stone-900 border-4 border-stone-600 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b-2 border-stone-800 bg-stone-950">
          <h2 className="font-headline text-3xl font-extrabold text-stone-200 uppercase">
            {loading ? 'Reading Scroll...' : data?.title}
          </h2>
          <button onClick={onClose} className="material-symbols-outlined text-stone-400 hover:text-white">close</button>
        </div>
        
        {error && <div className="p-6 text-error font-bold">{error}</div>}
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="material-symbols-outlined animate-spin text-4xl text-stone-600">progress_activity</span>
            </div>
          ) : (
            data?.cards?.map((card, idx) => (
              <div key={idx} className="bg-stone-800/80 p-4 border border-stone-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1 font-headline text-xl text-primary-container leading-tight">{card.term}</div>
                <div className="flex-1 font-body text-stone-300 leading-relaxed md:border-l border-stone-700 md:pl-4">{card.definition}</div>
              </div>
            ))
          )}
        </div>

        {!loading && data && (
          <div className="p-6 border-t-2 border-stone-800 bg-stone-950 flex justify-end gap-4">
            <button onClick={onClose} className="text-stone-400 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">Close Viewer</button>
            <button 
              onClick={() => { onAcquire(data); onClose(); }} 
              className="bg-primary text-on-primary px-8 py-3 font-headline font-bold text-lg uppercase tracking-widest hover:bg-primary-container active:translate-y-1 transition-all"
            >
              Acquire Grimoire
            </button>
          </div>
        )}
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
  const [editingSet, setEditingSet] = useState(null);
  const [previewId,  setPreviewId]  = useState(null);
  const [searchQuery,setSearchQuery]= useState('');
  const [loading,    setLoading]    = useState(true);
  const [publicLoading, setPublicLoading] = useState(false);
  const [showWardenPopup, setShowWardenPopup] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();

  useEffect(() => { 
    fetchMySets();
  }, []);

  useEffect(() => {
    fetchPublicSets();
  }, [searchQuery]);

  async function fetchMySets() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const myRes = await api.get('/api/grimoire/my');
      setMySets(myRes.data.sets || []);
    } catch (err) {
      console.error("Failed to load personal sets", err);
    }
    setLoading(false);
  }

  async function fetchPublicSets() {
    setPublicLoading(true);
    try {
      const res = await api.get(`/api/grimoire?limit=50&q=${encodeURIComponent(searchQuery)}`);
      if (res.data.sets) {
        // Only show public sets not created by the current user
        const others = res.data.sets.filter(s => !user || String(s.creatorId) !== String(user.id));
        setPublicSets(others);
      } else {
        setPublicSets([]);
      }
    } catch (err) {
      console.error("Failed to load realm knowledge", err);
    } 
    setPublicLoading(false);
  }

  async function fetchSets() {
    await Promise.all([fetchMySets(), fetchPublicSets()]);
  }

  function handleStudy(set) {
    navigate(`/grimoire/${set._id}/study`);
  }

  async function handleDelete(set) {
    const isOwner = !set.acquired;
    const action = isOwner ? 'delete' : 'remove';
    const confirmMsg = isOwner 
      ? `Are you sure you want to permanently DELETE "${set.title}"? This cannot be undone.`
      : `Remove "${set.title}" from your collection?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      if (isOwner) {
        await api.delete(`/api/grimoire/${set._id}`);
      } else {
        await api.post(`/api/grimoire/${set._id}/unacquire`);
      }
      fetchSets();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action}.`);
    }
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

  async function handleVote(set) {
    if (!user) return alert('You must log in to vote.');
    
    // Optimistic update
    const wasVoted = (set.upvotes || []).some(id => String(id) === String(user._id));
    setPublicSets(prev => prev.map(s => {
      if (s._id === set._id) {
        let newUpvotes = s.upvotes || [];
        if (wasVoted) {
          newUpvotes = newUpvotes.filter(id => String(id) !== String(user._id));
        } else {
          newUpvotes = [...newUpvotes, user._id];
        }
        return { ...s, upvotes: newUpvotes };
      }
      return s;
    }));

    try {
      await api.post(`/api/grimoire/${set._id}/vote`);
    } catch (err) {
      // Revert on failure
      fetchPublicSets();
      alert(err.response?.data?.error || err.message || 'Failed to update vote.');
    }
  }

  const filteredPublic = filter === 'length'
    ? [...publicSets].sort((a, b) => (b.cardCount ?? b.cards?.length ?? 0) - (a.cardCount ?? a.cards?.length ?? 0))
    : [...publicSets].sort((a, b) => (b.studiedCount ?? 0) - (a.studiedCount ?? 0));

  return (
    <div className="relative font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
        <img alt="Library background" className="w-full h-full object-cover opacity-25 mix-blend-luminosity" src="/maps/bg_library.png" />
      </div>
      <Navbar />
      <HudBar />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full">
        {(() => {
          const privateSets   = mySets.filter(s => !s.acquired);
          const communitySets = mySets.filter(s => s.acquired);
          
          return (
            <>
              {/* Page header */}
              <div className="mb-16">
                <h1 className="font-headline text-5xl font-extrabold text-surface-container-high mb-2">The Grimoire</h1>
                <p className="text-stone-400 max-w-2xl font-body italic">"Master the scrolls of old. Every sigil memorized is a blade sharpened against the void."</p>
              </div>

              {/* Private Grimoires */}
              <section className="mb-20">
                <div className="flex items-end justify-between mb-8 border-b-2 border-primary/20 pb-2">
                  <h2 className="font-headline text-3xl font-bold text-primary-container">Private Scrolls</h2>
                  <button onClick={() => { setEditingSet(null); setShowModal(true); setShowWardenPopup(false); }} className="text-primary-container flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="material-symbols-outlined">add_circle</span>
                    <span className="font-label uppercase text-sm font-bold tracking-widest">Inscribe New</span>
                  </button>
                </div>
                {privateSets.length === 0 ? (
                  <div className="bg-stone-800/30 border-2 border-dashed border-stone-700 p-12 text-center">
                    <p className="text-stone-500 italic">"No proprietary scrolls found in your collection."</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {privateSets.map((set, i) => (
                      <MyDeckCard
                        key={set._id}
                        set={set}
                        onStudy={handleStudy}
                        onDelete={handleDelete}
                        onEdit={(s) => { setEditingSet(s); setShowModal(true); }}
                        featured={set.featured || i === privateSets.length - 1}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Community Grimoires */}
              {communitySets.length > 0 && (
                <section className="mb-20">
                  <div className="flex items-end justify-between mb-8 border-b-2 border-secondary/20 pb-2">
                    <h2 className="font-headline text-3xl font-bold text-secondary">Community Scrolls</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {communitySets.map((set, i) => (
                      <MyDeckCard
                        key={set._id}
                        set={set}
                        onStudy={handleStudy}
                        onDelete={handleDelete}
                        featured={false}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          );
        })()}

        {/* Realm Knowledge */}
        <section>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 border-b-2 border-tertiary/20 pb-2 gap-4">
            <h2 className="font-headline text-3xl font-bold text-tertiary-fixed-dim">Realm Knowledge</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Search community scrolls..." 
                  className="w-full bg-stone-800 text-stone-200 pl-9 pr-3 py-1.5 text-sm border border-stone-700 outline-none focus:border-tertiary-fixed-dim transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSearchQuery(e.target.value);
                  }}
                  onBlur={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <span className="text-stone-500 font-label text-xs uppercase self-center hidden lg:block">Filter by:</span>
                <button
                  onClick={() => setFilter('popular')}
                  className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${filter === 'popular' ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'border border-stone-700 text-stone-400 hover:bg-stone-800'}`}
                >Popular</button>
                <button
                  onClick={() => setFilter('length')}
                  className={`px-3 py-1 text-xs font-bold uppercase transition-colors ${filter === 'length' ? 'bg-stone-800 text-stone-200 border border-stone-600' : 'border border-stone-700 text-stone-400 hover:bg-stone-800'}`}
                >Length</button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {publicLoading ? (
               <div className="text-center py-12 text-stone-500 italic">Reading the realm's archives...</div>
            ) : filteredPublic.length === 0 ? (
               <div className="text-center py-12 text-stone-500 italic">No community scrolls match your query.</div>
            ) : (
              filteredPublic.map(set => (
                <PublicDeckRow key={set._id} set={set} user={user} onAcquire={handleAcquire} onPreview={() => setPreviewId(set._id)} onVote={handleVote} />
              ))
            )}
          </div>
        </section>
      </main>

      {/* FAB — Inscribe New */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        {/* Warden Popup */}
        {showWardenPopup && (
          <div className="bg-stone-900 border-2 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative flex items-start gap-3 w-64 animate-bounce">
             <button onClick={() => setShowWardenPopup(false)} className="absolute top-1 right-1 text-stone-500 hover:text-stone-300">
               <span className="material-symbols-outlined text-sm">close</span>
             </button>
             <div className="w-10 h-10 border-2 border-primary shrink-0 bg-stone-800 flex items-center justify-center overflow-hidden shadow-sm relative">
                 <img src="/images/warden-archive.png" alt="Warden" className="w-full h-full object-cover relative z-10" onError={(e) => { e.target.style.display='none'; }} />
                 <span className="material-symbols-outlined text-primary text-2xl absolute">psychology</span>
             </div>
             <div className="pr-2">
               <p className="font-headline text-primary font-bold text-xs mb-1 uppercase tracking-widest leading-none">Warden</p>
               <p className="font-body text-sm text-stone-300 leading-tight block">Create a new grimoire and study.</p>
             </div>
             {/* Pointer to FAB */}
             <div className="absolute -bottom-[9px] right-6 w-4 h-4 bg-stone-900 border-b-2 border-r-2 border-primary rotate-45"></div>
          </div>
        )}
        <button
          onClick={() => { setEditingSet(null); setShowModal(true); setShowWardenPopup(false); }}
          className="w-16 h-16 bg-primary text-on-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:bg-primary-container active:translate-y-1 transition-all"
          style={{ boxShadow: 'inset 2px 2px 0px 0px #ffdea5, inset -2px -2px 0px 0px #483200, 4px 4px 0px 0px rgba(0,0,0,1)' }}
        >
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>ink_pen</span>
        </button>
      </div>

      {/* Modals */}
      {showModal && <SetModal onClose={() => { setShowModal(false); setEditingSet(null); }} onSave={fetchSets} initialSet={editingSet} />}
      {previewId && <PreviewModal setId={previewId} onClose={() => setPreviewId(null)} onAcquire={handleAcquire} />}
    </div>
  );
}
