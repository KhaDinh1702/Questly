import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/api';
import warriorImg from '../../assets/images/classes/warrior.jpg';
import mageImg from '../../assets/images/classes/mage.png';
import rogueImg from '../../assets/images/classes/rogue.jpg';

const CharacterSelection = () => {
  const [selectedClass, setSelectedClass] = useState('warrior');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/register');
      return;
    }
    userApi.getMe().then((res) => {
      const me = res.data ?? {};
      if (me.classProfile?.confirmedClass) {
        navigate('/path-selection');
      }
    }).catch(() => {});
  }, [navigate]);

  const handleForgePath = async () => {
    setLoading(true);
    setError('');
    try {
      await userApi.confirmClass(selectedClass);
      navigate('/path-selection');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm class.');
    } finally {
      setLoading(false);
    }
  };

  const classes = [
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'A bulwark of steel and grit, carving history through strength of arm and indomitable will.',
      icon: 'swords',
      image: warriorImg,
      skills: ['Heavy Cleave', 'Shield Wall'],
      attributes: { strength: 85, agility: 40, intellect: 30 },
    },
    {
      id: 'rogue',
      name: 'Rogue',
      description: 'Master of the unseen strike and the silent shadow. A legend whispered in darkened alleys.',
      icon: 'colorize',
      image: rogueImg,
      skills: ['Backstab', 'Vanish'],
      attributes: { strength: 45, agility: 95, intellect: 50 },
    },
    {
      id: 'mage',
      name: 'Mage',
      description: 'Wielder of the cosmic ink, turning the fabric of reality into a weapon of light and flame.',
      icon: 'auto_awesome',
      image: mageImg,
      skills: ['Arcane Surge', 'Frost Nova'],
      attributes: { strength: 20, agility: 35, intellect: 90 },
    },
  ];

  return (
    <div className="bg-surface-dim font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
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
        .ornate-frame::after {
          content: '';
          position: absolute;
          top: 4px; left: 4px; right: 4px; bottom: 4px;
          border: 1px solid #d2c5b2;
          pointer-events: none;
        }
        .portrait-arch {
          clip-path: polygon(0% 100%, 0% 15%, 5% 8%, 15% 3%, 30% 1%, 50% 0%, 70% 1%, 85% 3%, 95% 8%, 100% 15%, 100% 100%);
          border: 4px solid #7a5907;
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-[#fff9ed] dark:bg-[#1f1c0b] flex justify-between items-center w-full px-6 py-4 max-w-none border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-[#7a5907] dark:text-[#c29947] font-headline uppercase tracking-widest">Questly</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <span className="text-[#7a5907] border-b-2 border-[#7a5907] font-headline uppercase tracking-widest cursor-default">The Great Register</span>
        </nav>
        <div className="flex items-center gap-4 text-[#7a5907]">
          <span className="material-symbols-outlined cursor-pointer hover:text-[#c29947]" onClick={() => navigate('/')}>close</span>
        </div>
      </header>

      <main className="stone-texture flex flex-col items-center py-12 px-4 min-h-[calc(100vh-73px)]">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-16 relative">
            <h1 className="font-headline text-6xl md:text-8xl font-extrabold uppercase tracking-tighter text-on-surface mb-2">The Great Register</h1>
            <div className="flex justify-center items-center gap-4">
              <div className="h-px w-24 bg-primary"></div>
              <p className="font-headline italic text-2xl text-primary">Choose your destiny within the ink</p>
              <div className="h-px w-24 bg-primary"></div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto bg-error-container text-on-error-container p-4 mb-8 border-l-4 border-error text-sm font-bold shadow-lg text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            {classes.map((cls) => {
              const isSelected = selectedClass === cls.id;
              return (
                <article
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`ornate-frame p-1 group transition-all duration-300 cursor-pointer ${
                    isSelected ? 'ring-8 ring-primary/20 -translate-y-4 z-10 scale-105' : 'hover:-translate-y-2'
                  }`}
                >
                  <div className={`border p-6 h-full flex flex-col transition-colors ${isSelected ? 'border-primary bg-surface-container-low shadow-2xl relative' : 'border-outline'}`}>
                    {isSelected && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-8 py-1.5 font-headline uppercase text-sm tracking-[0.3em] pixel-bevel z-20 animate-pulse">
                        Selected
                      </div>
                    )}
                    <div className={`relative mb-8 portrait-arch aspect-[4/5] flex items-center justify-center border-4 border-primary overflow-hidden ${isSelected ? 'bg-primary/10 shadow-inner' : 'bg-surface-container-low'}`}>
                      <div className={`absolute inset-0 dither-pattern ${isSelected ? 'opacity-20' : 'opacity-10'}`}></div>
                      {cls.image ? (
                        <img src={cls.image} alt={cls.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-9xl scale-150 ${isSelected ? 'text-primary' : 'text-primary/80'}`} data-icon={cls.icon}>
                          {cls.icon}
                        </span>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${isSelected ? 'to-primary/20' : 'to-surface-container-low/20'}`}></div>
                    </div>

                    <h2 className="font-headline text-4xl font-bold text-center text-primary uppercase mb-2 tracking-widest">{cls.name}</h2>
                    <p className="text-on-surface-variant text-sm italic mb-8 leading-relaxed text-center px-4">
                      {cls.description}
                    </p>

                    <div className="space-y-8 flex-grow">
                      <section>
                        <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 border-b border-outline-variant pb-1 text-center">Primary Skills</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {cls.skills.map((skill) => (
                            <div key={skill} className={`flex items-center gap-2 text-xs text-on-surface p-2 ${isSelected ? 'bg-primary/10 border border-primary/20 font-bold' : 'bg-surface-container-highest/30'}`}>
                              <span className="w-1.5 h-1.5 bg-primary"></span> {skill}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4 border-b border-outline-variant pb-1 text-center">Attributes</h3>
                        <div className="space-y-4 px-2">
                          {Object.entries(cls.attributes).map(([attr, val]) => (
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
                        </div>
                      </section>
                    </div>

                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleForgePath(); }}
                        disabled={loading}
                        className="mt-10 bg-primary text-on-primary font-headline py-5 px-6 text-2xl uppercase font-bold tracking-[0.2em] pixel-bevel hover:bg-primary-container hover:text-on-primary-container transition-all active:translate-y-1 shadow-lg disabled:opacity-50"
                      >
                        {loading ? 'Forging...' : 'Forge This Path'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-8 border-t-2 border-primary/20 pt-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-4 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span className="font-headline uppercase text-lg font-bold text-primary tracking-[0.2em]">Warden's Notice</span>
              </div>
              <p className="text-on-surface text-base italic border-l-4 border-primary pl-6 py-2 leading-relaxed">
                Warden: "Are you certain about your choice?" You may still choose again before sealing your class.
              </p>
            </div>
            <div className="flex gap-6">
              <button
                onClick={() => setSelectedClass(classes[Math.floor(Math.random() * classes.length)].id)}
                className="font-headline py-3 px-10 border-2 border-tertiary text-tertiary uppercase font-bold text-sm tracking-[0.2em] hover:bg-tertiary hover:text-on-tertiary transition-colors shadow-md"
              >
                Randomize
              </button>
              <button
                onClick={() => navigate('/warden-intro')}
                className="font-headline py-3 px-10 border-2 border-outline text-outline uppercase font-bold text-sm tracking-[0.2em] hover:bg-outline hover:text-surface transition-colors shadow-md"
              >
                Think Again
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterSelection;
