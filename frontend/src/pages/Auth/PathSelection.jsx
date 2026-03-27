import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/api';

const PATHS = [
  {
    id: 'mastery',
    name: 'Path of Mastery',
    description: 'Master lost knowledge and rebuild the great archive.',
    skills: ['Bonus EXP gain', 'Higher rare scroll chance'],
    attributes: { lore: 90, combat: 45, wealth: 50 },
  },
  {
    id: 'conquest',
    name: 'Path of Conquest',
    description: 'Descend into Dungeons and crush the source of corruption.',
    skills: ['Higher rare gear chance', 'Gacha ticket milestones'],
    attributes: { lore: 50, combat: 90, wealth: 55 },
  },
  {
    id: 'trial',
    name: 'Path of Trial',
    description: 'A mind of precision. No mistakes. No fear.',
    skills: ['Higher currency gain', '+10% dungeon turns'],
    attributes: { lore: 70, combat: 65, wealth: 90 },
  },
];

export default function PathSelection() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState('mastery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    userApi.getMe().then((res) => {
      const me = res.data ?? {};
      if (!me.classProfile?.confirmedClass) {
        navigate('/character-selection');
      } else if (me.pathProfile?.confirmedPath) {
        navigate('/');
      }
    }).catch(() => {});
  }, [navigate]);

  async function handleConfirmPath() {
    setLoading(true);
    setError('');
    try {
      await userApi.confirmPath(selectedPath);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error ?? 'Failed to confirm path.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-dim font-body text-on-surface min-h-screen">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pixel-bevel {
          box-shadow: inset 2px 2px 0px 0px #ffdea5, inset -2px -2px 0px 0px #483200;
        }
        .stone-texture {
          background-color: #e2dabf;
          background-image: radial-gradient(#d2c5b2 1px, transparent 0);
          background-size: 4px 4px;
        }
        .dither-pattern {
          background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIElEQVQIW2NkYGD4D8SogAsD8f8zMGAIIGYEqsIWAAB2DwwL6V0XAAAAAElFTkSuQmCC");
        }
        .ornate-frame {
          border: 4px solid #7a5907;
          position: relative;
          background: #fff9ed;
        }
        .ornate-frame::before {
          content: '';
          position: absolute;
          top: -8px; left: -8px; right: -8px; bottom: -8px;
          border: 1px solid #7a5907;
          pointer-events: none;
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-[#fff9ed] flex justify-between items-center w-full px-6 py-4 border-b border-outline-variant">
        <span className="text-2xl font-bold text-[#7a5907] font-headline uppercase tracking-widest">Questly</span>
        <span className="text-[#7a5907] border-b-2 border-[#7a5907] font-headline uppercase tracking-widest">Seeker Path</span>
        <span className="material-symbols-outlined cursor-pointer text-[#7a5907]" onClick={() => navigate('/character-selection')}>arrow_back</span>
      </header>

      <main className="stone-texture flex flex-col items-center py-6 px-4">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-16">
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-on-surface mb-1">Choose Your Path</h1>
            <p className="font-headline italic text-lg text-primary">Warden: "What is your goal?"</p>
          </div>

          {error && <div className="max-w-md mx-auto bg-error-container text-on-error-container p-4 mb-8 border-l-4 border-error text-sm font-bold text-center">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            {PATHS.map((path) => {
              const isSelected = selectedPath === path.id;
              return (
                <article
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className={`ornate-frame p-1 transition-all duration-300 cursor-pointer ${isSelected ? 'ring-8 ring-primary/20 -translate-y-4 z-10 scale-105' : 'hover:-translate-y-2'}`}
                >
                  <div className={`border p-4 h-full flex flex-col ${isSelected ? 'border-primary bg-surface-container-low shadow-2xl relative' : 'border-outline'}`}>
                    {isSelected && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-8 py-1.5 font-headline uppercase text-sm tracking-[0.3em] pixel-bevel z-20 animate-pulse">Selected</div>}
                    <h2 className="font-headline text-3xl font-bold text-center text-primary uppercase mb-1">{path.name}</h2>
                    <p className="text-on-surface-variant text-xs italic mb-4 text-center">{path.description}</p>

                    <section className="mb-6">
                      <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2 border-b border-outline-variant pb-1 text-center">Rewards</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {path.skills.map((skill) => (
                          <div key={skill} className={`flex items-center gap-2 text-xs p-2 ${isSelected ? 'bg-primary/10 border border-primary/20 font-bold' : 'bg-surface-container-highest/30'}`}>
                            <span className="w-1.5 h-1.5 bg-primary"></span>{skill}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-4 px-2">
                      {Object.entries(path.attributes).map(([attr, val]) => (
                        <div key={attr} className="space-y-1">
                          <div className={`flex justify-between text-[9px] uppercase font-bold ${isSelected ? 'text-primary/70' : 'text-outline'}`}>
                            <span>{attr}</span>
                            <span>{val}%</span>
                          </div>
                          <div className="h-3 bg-surface-container-highest w-full p-0.5">
                            <div className="h-full bg-primary dither-pattern transition-all duration-500" style={{ width: `${val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col md:flex-row justify-between items-end gap-8 border-t-2 border-primary/20 pt-8">
            <p className="text-on-surface text-base italic border-l-4 border-primary pl-6 py-2 leading-relaxed max-w-xl">
              Warden: "The path you choose is dangerous. Are you truly certain?"
            </p>
            <div className="flex gap-6">
              <button onClick={handleConfirmPath} disabled={loading} className="font-headline py-3 px-10 bg-primary text-on-primary uppercase font-bold text-sm tracking-[0.2em] hover:bg-primary-container transition-colors shadow-md disabled:opacity-50">
                {loading ? 'Sealing...' : 'I Am Certain'}
              </button>
              <button onClick={() => navigate('/character-selection')} className="font-headline py-3 px-10 border-2 border-outline text-outline uppercase font-bold text-sm tracking-[0.2em] hover:bg-outline hover:text-surface transition-colors shadow-md">
                Wait
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
