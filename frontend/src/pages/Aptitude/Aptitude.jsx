import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function Aptitude() {
  const navigate = useNavigate();
  const location = useLocation();

  // Passed from GrimoireStudy: { setId, title }
  const fromStudy = location.state ?? null;

  // 'lobby' | 'loading' | 'active' | 'complete'
  const [phase, setPhase] = useState('lobby');
  const [error, setError] = useState(null);

  // History of studied sets (from /api/grimoire/my)
  const [studiedSets, setStudiedSets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Test runtime state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [rewardEligible, setRewardEligible] = useState(true);
  const [remainingTests, setRemainingTests] = useState(null);
  const [totalLimit, setTotalLimit] = useState(null);
  const [remainingPracticeAttempts, setRemainingPracticeAttempts] = useState(null);
  const [testMode, setTestMode] = useState('real'); // 'real' | 'practice'
  const [testSetId, setTestSetId] = useState(null);

  // Mode selection state for flashcard sets
  const [pendingSetChoice, setPendingSetChoice] = useState(null); // { setId, title }

  // Result state
  const [rewards, setRewards] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [postBalance, setPostBalance] = useState(null);

  // ─── Fetch previously studied sets for lobby ─────────────────
  useEffect(() => {
    api.get('/api/grimoire/my')
      .then(res => {
        // Only show sets the user has actually started studying (progress > 0)
        const sets = (res.data.sets || []).filter(s => (s.progress ?? 0) > 0);
        setStudiedSets(sets);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    // Fetch daily quota
    api.get('/api/aptitude/quota')
      .then(res => {
        setRemainingTests(res.data.remainingTests ?? null);
        setTotalLimit(res.data.limit ?? null);
      })
      .catch(() => {});
  }, []);

  // ─── Start a test ─────────────────────────────────────────────
  async function startTest(targetSetId = null, mode = 'real') {
    setPhase('loading');
    setError(null);
    setRemainingPracticeAttempts(null);
    setTestMode(mode === 'practice' ? 'practice' : 'real');
    setTestSetId(targetSetId ?? null);
    try {
      const normalizedMode = mode === 'practice' ? 'practice' : 'real'
      const urlParts = [`/api/aptitude/start?count=20&mode=${normalizedMode}`]
      if (targetSetId) urlParts.push(`setId=${targetSetId}`)

      const url = urlParts.length === 1 ? urlParts[0] : `${urlParts[0]}&${urlParts[1]}`
      const res = await api.post(url);
      if (res.data.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setRewardEligible(res.data.rewardEligible ?? true);
        setRemainingTests(res.data.remainingTests ?? null);
        setTotalLimit(res.data.limit ?? null);
        setRemainingPracticeAttempts(res.data.remainingPracticeAttempts ?? null);
        setTestMode(res.data.mode ?? normalizedMode);
        setTestSetId(targetSetId ?? null);
        setCurrentIndex(0);
        setCorrectAnswers(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setPhase('active');
        setPendingSetChoice(null);
      } else {
        setError("You haven't studied any Grimoires yet. Please acquire and study a Grimoire first.");
        setPhase('lobby');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start the trial.');
      setPhase('lobby');
    }
  }

  // ─── Answer handling ─────────────────────────────────────────
  const handleOptionSelect = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === questions[currentIndex].correctOption;
    const newCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
    if (isCorrect) setCorrectAnswers(newCorrect);

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        submitTest(newCorrect);
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      }
    }, 1500);
  };

  const submitTest = async (finalScore) => {
    setPhase('complete');
    setSubmitting(true);
    try {
      const res = await api.post('/api/aptitude/submit', {
        totalQuestions: questions.length,
        correctAnswers: finalScore,
        rewardEligible,
        mode: testMode,
        setId: testSetId,
      });
      setRewards({ turns: res.data.turns ?? res.data.moves ?? 0, gold: res.data.gold || 0, tickets: res.data.tickets || 0 });
      if (rewardEligible) {
        const balRes = await api.get('/api/users/me');
        setPostBalance(balRes.data);
      }
    } catch (err) {
      console.error('Failed to submit test', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── LOBBY ───────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="relative font-body text-on-surface min-h-screen flex flex-col">
        <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
          <img alt="Library background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" src="/maps/bg_library.png" />
        </div>
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto w-full">

          <div className="text-center">
            <h1 className="font-headline text-5xl font-black text-primary mb-2">The Aptitude Trial</h1>
            <p className="text-stone-400 italic text-sm">Test your knowledge. Earn gold and dungeon turns.</p>
            {remainingTests !== null && totalLimit !== null && (
              <p className="mt-2 text-primary-container font-black uppercase text-xs tracking-widest">
                Daily Quota: {remainingTests} / {totalLimit} Remaining
              </p>
            )}
          </div>

          {error && (
            <div className="w-full bg-error-container text-on-error-container p-4 border-l-4 border-error font-bold text-sm">
              {error}
            </div>
          )}

          {pendingSetChoice && (
            <div className="w-full bg-surface-container-high border-2 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
              <span className="block text-xs font-bold uppercase text-primary tracking-widest mb-1">Flashcard Set — Choose Mode</span>
              <h2 className="font-headline text-3xl font-black text-on-surface mb-2">{pendingSetChoice.title}</h2>
              <p className="text-stone-400 text-sm italic mb-6">
                Real Test: only 1 completion per set. Practice Test: up to 5 attempts until you complete Real Test.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => startTest(pendingSetChoice.setId, 'real')}
                  className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-primary-container transition-colors active:translate-y-1"
                >
                  Real Test
                </button>
                <button
                  onClick={() => startTest(pendingSetChoice.setId, 'practice')}
                  className="w-full border-2 border-stone-600 text-stone-300 py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-stone-800 transition-colors active:translate-y-1"
                >
                  Practice Test
                </button>
              </div>

              <button
                onClick={() => setPendingSetChoice(null)}
                className="mt-4 w-full border border-stone-600 text-stone-300 py-3 font-headline font-bold text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors active:translate-y-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Recommended (just finished) */}
          {fromStudy?.setId && (
            <div className="w-full bg-surface-container-high border-2 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
              <span className="block text-xs font-bold uppercase text-primary tracking-widest mb-1">Recommended — Just Studied</span>
              <h2 className="font-headline text-3xl font-black text-on-surface mb-2">{fromStudy.title}</h2>
              <p className="text-stone-400 text-sm italic mb-4">10 questions drawn exclusively from this grimoire.</p>
              <button
                onClick={() => setPendingSetChoice({ setId: fromStudy.setId, title: fromStudy.title })}
                className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-primary-container transition-colors active:translate-y-1"
              >
                Choose Test Mode — {fromStudy.title}
              </button>
            </div>
          )}

          {/* Previously studied sets */}
          {!loadingHistory && studiedSets.length > 0 && (
            <div className="w-full">
              <p className="text-xs font-bold uppercase text-stone-500 tracking-widest mb-3">Your Studied Grimoires</p>
              <div className="space-y-2">
                {studiedSets.map(set => (
                  <div key={set._id} className="flex items-center justify-between bg-surface-container border border-stone-700 p-4 hover:bg-stone-800 transition-colors">
                    <div>
                      <p className="font-headline font-bold text-on-surface text-lg leading-tight">{set.title}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {set.cards?.length ?? 0} scrolls · <span className="text-primary">{set.progress ?? 0}% mastered</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setPendingSetChoice({ setId: set._id, title: set.title })}
                      className="ml-4 shrink-0 px-5 py-2 border-2 border-stone-600 text-stone-300 font-label uppercase text-xs font-bold hover:bg-stone-700 hover:text-white transition-all active:scale-95"
                    >
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center w-full gap-4">
            <div className="flex-grow h-px bg-stone-700" />
            <span className="text-stone-500 text-xs uppercase font-bold tracking-widest">or</span>
            <div className="flex-grow h-px bg-stone-700" />
          </div>

          {/* Generic random trial */}
          <div className="w-full bg-surface-container border border-stone-700 p-6">
            <span className="block text-xs font-bold uppercase text-stone-500 tracking-widest mb-1">Random Trial</span>
            <h2 className="font-headline text-2xl font-black text-stone-300 mb-2">Mixed Grimoire Challenge</h2>
            <p className="text-stone-500 text-sm italic mb-4">10 questions drawn randomly from all your acquired and created grimoires.</p>
            <button
              onClick={() => startTest(null, 'real')}
              className="w-full border-2 border-stone-600 text-stone-300 py-4 font-headline font-bold text-lg uppercase tracking-widest hover:bg-stone-800 transition-colors active:translate-y-1"
            >
              Start Random Trial
            </button>
          </div>

          <button onClick={() => navigate('/grimoire')} className="text-stone-500 hover:text-stone-300 text-sm font-bold uppercase tracking-widest transition-colors">
            ← Return to Grimoire
          </button>
        </main>
      </div>
    );
  }

  // ─── LOADING ─────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-200 flex items-center justify-center font-headline text-2xl">
        Summoning Trial...
      </div>
    );
  }

  // ─── COMPLETE ────────────────────────────────────────────────
  if (phase === 'complete') {
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    const passed = finalScore >= 50;

    return (
      <div className="relative font-body text-on-surface min-h-screen flex flex-col border-t-8 border-tertiary">
        <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
          <img alt="Library background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" src="/maps/bg_library.png" />
        </div>
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="bg-surface-container-high p-12 max-w-xl w-full text-center border-2 border-stone-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)]">

            {/* Practice mode banner */}
            {testMode === 'practice' && (
              <div className="bg-stone-800 border border-stone-600 text-stone-400 text-xs font-bold uppercase tracking-widest py-2 px-4 mb-6">
                Practice Test — no rewards this run.
                {remainingPracticeAttempts !== null && remainingPracticeAttempts !== undefined ? (
                  <span className="block font-bold text-stone-300 mt-1 normal-case tracking-wider">
                    Remaining practice attempts: {remainingPracticeAttempts}
                  </span>
                ) : null}
              </div>
            )}
            {testMode === 'real' && !rewardEligible && (
              <div className="bg-stone-800 border border-stone-600 text-stone-400 text-xs font-bold uppercase tracking-widest py-2 px-4 mb-6">
                Real Test — daily reward limit reached. No rewards this run.
              </div>
            )}

            <h1 className="font-headline text-5xl font-black text-on-surface mb-2">
              {passed ? 'Trial Passed' : 'Trial Failed'}
            </h1>
            <p className="text-stone-400 text-sm mb-8 italic uppercase tracking-widest">
              {passed ? 'The archives accept your knowledge.' : 'You must gaze deeper into the scrolls.'}
            </p>

            <div className="text-6xl font-headline font-bold mb-2">
              <span className={passed ? 'text-tertiary' : 'text-error'}>{correctAnswers}</span>
              <span className="text-3xl text-stone-600"> / {questions.length}</span>
            </div>
            <p className="text-stone-500 uppercase tracking-widest text-xs font-bold mb-10">Score: {finalScore}%</p>

            {submitting ? (
              <p className="text-stone-400 animate-pulse font-label uppercase text-sm tracking-widest mb-10">Calculating Rewards...</p>
            ) : rewardEligible && rewards ? (
              <>
                <div className={`grid gap-4 mb-6 border-y-2 border-stone-800 py-6 ${rewards.tickets > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>directions_walk</span>
                    <span className="text-3xl font-headline font-black text-primary">+{rewards.turns}</span>
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest mt-1">Turns Gained</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl text-tertiary-fixed mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>generating_tokens</span>
                    <span className="text-3xl font-headline font-black text-tertiary-fixed">+{rewards.gold}</span>
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest mt-1">Gold Received</span>
                  </div>
                  {rewards.tickets > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-3xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                      <span className="text-3xl font-headline font-black text-secondary">+{rewards.tickets}</span>
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest mt-1">Gacha Tickets</span>
                    </div>
                  )}
                </div>
                {postBalance && (
                  <div className="flex justify-center gap-8 mb-6 text-sm">
                    <div className="text-center">
                      <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest">Total Turns</p>
                      <p className="font-headline font-black text-primary text-lg">{(postBalance.dungeonMoves || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest">Total Gold</p>
                      <p className="font-headline font-black text-tertiary-fixed text-lg">{(postBalance.gold || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-stone-500 text-[10px] uppercase font-bold tracking-widest">Gacha Tickets</p>
                      <p className="font-headline font-black text-secondary text-lg">{(postBalance.ticketCount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setPhase('lobby'); setRewards(null); setPostBalance(null); }}
                className="w-full bg-primary text-on-primary py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-primary-container transition-colors active:translate-y-1"
              >
                Take Another Trial
              </button>
              <button
                onClick={() => navigate('/grimoire')}
                className="w-full bg-stone-800 text-stone-200 py-4 font-headline font-bold text-xl uppercase tracking-widest hover:bg-stone-700 border border-stone-600 transition-colors active:translate-y-1"
              >
                Return to Grimoire
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── ACTIVE TEST ─────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];

  return (
    <div className="relative font-body text-on-surface min-h-screen flex flex-col">
      <div className="fixed inset-0 w-full h-full z-[-1] bg-stone-900 overflow-hidden">
        <img alt="Library background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" src="/maps/bg_library.png" />
      </div>
      <Navbar />

      {/* Mode banner */}
      {testMode === 'practice' && (
        <div className="w-full bg-stone-800 text-stone-400 text-center text-xs font-bold uppercase tracking-widest py-2">
          Practice Test — no rewards this run.
          {remainingPracticeAttempts !== null && remainingPracticeAttempts !== undefined ? (
            <span className="block font-bold text-stone-300 mt-1 normal-case tracking-wider">
              Remaining practice attempts: {remainingPracticeAttempts}
            </span>
          ) : null}
        </div>
      )}
      {testMode === 'real' && !rewardEligible && (
        <div className="w-full bg-stone-800 text-stone-400 text-center text-xs font-bold uppercase tracking-widest py-2">
          Real Test — daily reward limit reached. No rewards this run.
        </div>
      )}

      {/* Early leave warning (Real Test) */}
      {testMode === 'real' && testSetId && (
        <div className="w-full bg-error-container/20 border border-error/30 text-error text-center text-xs font-bold uppercase tracking-widest py-2 px-4">
          Warning: If you leave this Real Test before finishing (refresh, close tab, or navigate away), you will lose your Real Test attempt for this flashcard set and you won&apos;t be able to take the Real Test again. Practice will remain available.
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-stone-950 px-6 py-4 flex flex-col items-center">
        <div className="w-full max-w-3xl flex justify-between text-[10px] uppercase font-bold text-stone-500 tracking-widest mb-2">
          <span>Question {currentIndex + 1}</span>
          <span>{questions.length - currentIndex - 1} Remaining</span>
        </div>
        <div className="w-full max-w-3xl h-1 bg-stone-800">
          <div
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center p-6 w-full max-w-4xl mx-auto mt-8">
        <div className="w-full text-center mb-12">
          <span className="inline-block px-3 py-1 bg-stone-800 text-stone-400 uppercase tracking-widest text-[10px] font-bold mb-6 border border-stone-700">What is the meaning of</span>
          <h2 className="font-headline text-3xl md:text-5xl font-black text-surface-container-high leading-tight">
            {currentQuestion.term}
          </h2>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = 'bg-surface-container hover:bg-stone-800 border-stone-700 hover:border-primary cursor-pointer';
            if (isAnswered) {
              const isCorrectOption = option === currentQuestion.correctOption;
              const isSelected = option === selectedOption;
              if (isCorrectOption) stateClass = 'bg-tertiary-container text-on-tertiary-container border-tertiary';
              else if (isSelected) stateClass = 'bg-error-container text-on-error-container border-error';
              else stateClass = 'bg-surface-container opacity-50 border-stone-800 cursor-default';
            }
            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(option)}
                className={`text-left p-6 font-body text-lg md:text-xl border-2 transition-all duration-200 active:scale-[0.98] ${stateClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
