import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function GrimoireStudy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Study state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentIndexRef = useRef(0);
  const knownCountRef = useRef(0);
  const setRef = useRef(null);
  const savingRef = useRef(false);
  const lastAutoSaveAtRef = useRef(0);

  useEffect(() => {
    async function fetchSet() {
      try {
        const [setRes, progressRes] = await Promise.all([
          api.get(`/api/grimoire/${id}`),
          api.get(`/api/grimoire/${id}/progress`).catch(() => null),
        ]);

        setSet(setRes.data);
        setRef.current = setRes.data;

        const progressData = progressRes?.data;
        if (progressData) {
          setCurrentIndex(progressData.currentIndex ?? 0);
          setKnownCount(progressData.knownCount ?? 0);
          setStudyComplete(Boolean(progressData.studyCompleted));
          setIsFlipped(false); // resume from the exact card, but always show the term first
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load Grimoire.');
      } finally {
        setLoading(false);
      }
    }
    fetchSet();
  }, [id]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    knownCountRef.current = knownCount;
  }, [knownCount]);

  function computeSessionProgressPct() {
    const s = setRef.current;
    if (!s?.cards?.length) return 0;
    const idx = currentIndexRef.current;
    return Math.round(((idx + 1) / s.cards.length) * 100);
  }

  async function saveProgressSession({ markCompleted = false } = {}) {
    if (!setRef.current?.cards?.length) return;

    const payload = {
      progress: computeSessionProgressPct(),
      currentIndex: currentIndexRef.current,
      knownCount: knownCountRef.current,
      studyCompleted: markCompleted,
    };

    try {
      savingRef.current = true;
      await api.post(`/api/grimoire/${id}/progress`, payload);
    } catch {
      // best-effort save (do not block UI)
    } finally {
      savingRef.current = false;
    }
  }

  function saveProgressKeepAlive({ markCompleted = false } = {}) {
    if (!setRef.current?.cards?.length) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      progress: computeSessionProgressPct(),
      currentIndex: currentIndexRef.current,
      knownCount: knownCountRef.current,
      studyCompleted: markCompleted,
    };

    const baseURL = (api.defaults?.baseURL ?? '').replace(/\/$/, '');
    const url = baseURL ? `${baseURL}/api/grimoire/${id}/progress` : `/api/grimoire/${id}/progress`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'include',
    }).catch(() => {});
  }

  useEffect(() => {
    function scheduleAutoSave() {
      const now = Date.now();
      // Throttle to avoid spamming on rapid visibility changes.
      if (now - lastAutoSaveAtRef.current < 1200) return;
      lastAutoSaveAtRef.current = now;

      // If we already completed, do not overwrite with session progress.
      if (savingRef.current || studyComplete) return;

      saveProgressKeepAlive({ markCompleted: false });
    }

    document.addEventListener('visibilitychange', scheduleAutoSave);
    window.addEventListener('pagehide', scheduleAutoSave);
    window.addEventListener('beforeunload', scheduleAutoSave);

    return () => {
      document.removeEventListener('visibilitychange', scheduleAutoSave);
      window.removeEventListener('pagehide', scheduleAutoSave);
      window.removeEventListener('beforeunload', scheduleAutoSave);
    };
  }, [studyComplete, id]);

  const handleRestart = async () => {
    setCurrentIndex(0);
    setKnownCount(0);
    setStudyComplete(false);
    setIsFlipped(false);
    
    try {
      setSaving(true);
      await api.post(`/api/grimoire/${id}/progress`, {
        progress: 0,
        currentIndex: 0,
        knownCount: 0,
        studyCompleted: false,
      });
    } catch (err) {
      console.error("Failed to reset progress", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (knewIt) => {
    setIsFlipped(false);
    
    // We update state safely based on previous value
    let newKnownCount = knownCount;
    if (knewIt) {
      newKnownCount += 1;
      setKnownCount(prev => prev + 1);
    }

    if (currentIndex + 1 >= set.cards.length) {
      // Finished
      setStudyComplete(true);
      setSaving(true);
      try {
        await api.post(`/api/grimoire/${id}/progress`, {
          // Session progress is 100% when the user reaches the end.
          progress: 100,
          currentIndex: set.cards.length - 1,
          knownCount: newKnownCount,
          studyCompleted: true,
        });
      } catch (err) {
        console.error("Failed to save progress", err);
      } finally {
        setSaving(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading) return <div className="min-h-screen bg-stone-900 text-stone-200 flex items-center justify-center font-headline text-2xl">Unsealing Grimoire...</div>;
  if (error) return <div className="min-h-screen bg-stone-900 text-error flex items-center justify-center font-headline text-2xl">{error}</div>;
  if (!set || !set.cards || set.cards.length === 0) return <div className="min-h-screen bg-stone-900 text-stone-200 flex items-center justify-center">This Grimoire is empty.</div>;

  if (studyComplete) {
    const finalScore = Math.round((knownCount / set.cards.length) * 100);
    return (
      <div className="relative font-body text-on-surface min-h-screen flex flex-col">
        <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
          <img alt="Library background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" src="/maps/bg_library.png" />
        </div>
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-surface-container-high p-12 max-w-2xl w-full text-center border-2 border-primary-container shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)]">
            <h1 className="font-headline text-5xl font-black text-primary mb-4">Study Complete</h1>
            <p className="text-stone-300 text-lg mb-8 italic">You have absorbed the knowledge of "{set.title}".</p>
            
            <div className="text-6xl font-headline font-bold text-tertiary mb-2">{finalScore}%</div>
            <p className="text-stone-400 uppercase tracking-widest text-xs font-bold mb-12">Mastery Gained</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => navigate('/aptitude', { state: { setId: id, title: set.title } })}
                className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-primary-container transition-colors active:translate-y-1"
              >
                Take Aptitude Test
              </button>
              <button 
                onClick={handleRestart}
                className="w-full border-2 border-stone-600 py-4 font-headline font-bold text-xl uppercase tracking-widest text-stone-300 hover:bg-stone-800 transition-colors active:translate-y-1"
              >
                Study Again
              </button>
              <button 
                onClick={() => navigate('/grimoire')}
                className="w-full border-2 border-primary py-4 font-headline font-bold text-xl uppercase tracking-widest text-primary hover:bg-stone-800 transition-colors active:translate-y-1"
              >
                Return to Library
              </button>
            </div>
            {saving && <p className="text-xs text-stone-500 mt-4 animate-pulse">Recording progress in the archives...</p>}
          </div>
        </main>
      </div>
    );
  }

  const currentCard = set.cards[currentIndex];

  return (
    <div className="relative font-body text-on-surface min-h-screen flex flex-col">
      <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
        <img alt="Library background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" src="/maps/bg_library.png" />
      </div>
      <Navbar />
      
      {/* HUD Bar */}
      <div className="w-full bg-stone-950 px-6 py-3 border-b-2 border-stone-800 flex justify-between items-center">
        <button
          onClick={async () => {
            // Ensure leaving the page updates progress for resume.
            await saveProgressSession({ markCompleted: false });
            navigate('/grimoire');
          }}
          className="text-stone-400 hover:text-stone-200 flex items-center gap-2 font-label uppercase text-xs font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Return
        </button>
        <div className="text-stone-400 font-label uppercase text-xs font-bold tracking-widest">
          Scroll {currentIndex + 1} of {set.cards.length}
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
        
        {/* Flashcard Area */}
        <div 
          className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            /* Front (Term) */
            <div className="w-full h-full bg-surface-container border-2 border-stone-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center p-8 group-hover:border-primary transition-colors animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <span className="block text-primary uppercase text-xs font-bold tracking-widest mb-4 opacity-50">Term</span>
                <h2 className="font-headline text-4xl md:text-5xl font-black text-on-surface">{currentCard.term}</h2>
              </div>
            </div>
          ) : (
            /* Back (Definition) */
            <div className="w-full h-full bg-surface-container-high border-2 border-tertiary shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
              <div className="text-center w-full h-full flex flex-col items-center justify-center">
                <span className="block text-tertiary uppercase text-xs font-bold tracking-widest mb-4 opacity-50">Definition</span>
                <div className="overflow-y-auto max-h-[80%] w-full custom-scrollbar pr-2">
                  <p className="font-body text-xl md:text-2xl text-on-surface-variant leading-relaxed">
                    {currentCard.definition}
                  </p>
                  {currentCard.imageUrl && (
                    <img src={currentCard.imageUrl} alt={currentCard.term} className="mt-6 max-h-48 mx-auto object-contain border border-stone-700" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`mt-12 flex items-center gap-6 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(false); }}
            className="w-48 bg-error-container text-on-error-container py-4 font-label font-bold text-lg uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2 border border-error/20"
          >
            <span className="material-symbols-outlined">close</span> Study Again
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(true); }}
            className="w-48 bg-primary text-on-primary py-4 font-label font-bold text-lg uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined">check</span> I Know This
          </button>
        </div>
        
        <p className={`mt-6 text-stone-500 italic text-sm transition-opacity duration-300 ${!isFlipped ? 'opacity-100' : 'opacity-0'}`}>
          Click the card to reveal the secret...
        </p>

      </main>
    </div>
  );
}
