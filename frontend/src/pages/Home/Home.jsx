import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="bg-surface-dim font-body text-on-surface">
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section: The Living Artifact */}
        <section className="relative w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 bg-surface p-12 shadow-[8px_8px_0_0_#ebe2c8] border-2 border-outline-variant relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary flex items-center justify-center rotate-12 shadow-md">
              <span
                className="material-symbols-outlined text-on-primary"
                data-icon="auto_awesome"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <h1 className="font-headline text-5xl md:text-6xl text-primary font-extrabold leading-none mb-6">
              Forge Your Legend In Ink
            </h1>
            <p className="font-body text-xl text-on-surface-variant mb-10 max-w-lg leading-relaxed italic">
              The Great Ledger awaits your name. Step into the sprawling lands of
              Aethelgard, where every choice is etched forever in the annals of
              history.
            </p>
            <button className="bg-primary text-on-primary font-headline text-xl font-bold uppercase tracking-widest px-10 py-5 pixel-border-wood flex items-center gap-4 hover:bg-primary-container active:translate-y-1 active:shadow-none transition-all">
              <span>Start Your Adventure</span>
              <span className="material-symbols-outlined" data-icon="swords">
                swords
              </span>
            </button>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full h-[500px] bg-surface-container relative border-4 border-on-surface shadow-[12px_12px_0_0_#1f1c0b]">
              <img
                alt="Retro pixel art landscape"
                className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM10H-ddLwOcHiWALL7HJuUecBsg38YCKaxFj_8Qq0on8COrCDbR8RqsX_CqqmtvnUMUbg5xJtjscwARq3nmWP4qjUe_XXMjr7F3A-8CR3m9Boswjq_To1W_VtYPpQEfCG04yImVdd7zIsAnOp7FDjXITMk1OxAJEOLv3kAKks3XWnqL5D59BFqjuWegc-flC1Hr3Vh8m33CxPLb98gKvdyycaaXJOk7nckDozE3bgXLDPDLDzdjdOZxfUEhuJ9cOSVxbqg3TwTbA"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <span
                  className="material-symbols-outlined text-primary scale-[4]"
                  data-icon="castle"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  castle
                </span>
                <div className="mt-12 bg-on-surface text-surface px-4 py-2 font-label uppercase tracking-tighter">
                  Current Map: The Whispering Peaks
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento: Top Adventurers & Marketplace */}
        <section className="w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Leaderboard (Bento Large Left) */}
          <div className="lg:col-span-4 bg-surface-container-low p-8 border-2 border-outline-variant">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="military_tech"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                military_tech
              </span>
              <h2 className="font-headline text-xl font-bold uppercase">
                Top Adventurers
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Sir Thorne', role: 'Grand Paladin', lvl: 99, id: '01' },
                { name: 'Elena the Swift', role: 'Ranger', lvl: 94, id: '02' },
                { name: 'Grimnir Redbeard', role: 'Berserker', lvl: 92, id: '03' },
              ].map((adv) => (
                <div
                  key={adv.id}
                  className={`flex items-center justify-between p-4 bg-surface hover:bg-surface-container transition-colors ${
                    adv.id === '01' ? 'border-l-4 border-primary-container' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-headline text-2xl font-black text-outline">
                      {adv.id}
                    </span>
                    <div>
                      <p className="font-bold text-on-surface">{adv.name}</p>
                      <p className="text-xs font-label text-on-surface-variant uppercase">
                        {adv.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-primary font-bold">LVL {adv.lvl}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button className="font-headline text-primary font-bold uppercase text-sm underline underline-offset-4 hover:text-primary-container transition-colors">
                View Global Ranks
              </button>
            </div>
          </div>

          {/* Marketplace Grid (Bento Large Right) */}
          <div className="lg:col-span-8 bg-surface-container-highest p-8 border-2 border-on-surface">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="shopping_basket"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shopping_basket
                </span>
                <h2 className="font-headline text-xl font-bold uppercase">
                  Latest Loot Market
                </h2>
              </div>
              <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 font-bold animate-pulse">
                NEW ARRIVALS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Iron Kite Shield', price: '250g', icon: 'shield' },
                { name: 'Greater Elixir', price: '120g', icon: 'vital_signs' },
                { name: 'Mage Staff', price: '800g', icon: 'magic_button' },
                { name: 'Old Copper Key', price: '15g', icon: 'key' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-surface-variant border border-outline p-4 group cursor-pointer active:scale-95 transition-all"
                >
                  <div className="aspect-square bg-surface-dim flex items-center justify-center mb-3 group-hover:bg-primary-container transition-colors">
                    <span
                      className="material-symbols-outlined text-on-surface-variant group-hover:text-on-primary transition-colors text-3xl"
                      data-icon={item.icon}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <p className="font-label text-xs font-bold text-center mb-1">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-center text-primary-container font-black">
                    {item.price}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter / Lore Sign Up */}
        <section className="w-full bg-primary-container py-20 px-6 border-y-4 border-on-primary-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-headline text-3xl text-on-primary-container font-extrabold uppercase mb-4">
              Receive the Royal Proclamation
            </h2>
            <p className="font-body text-on-primary-container opacity-90 mb-8">
              Sign with your email to receive monthly lore updates, special event
              summons, and rare loot drops.
            </p>
            <form className="flex flex-col sm:flex-row gap-0 border-4 border-on-primary-container">
              <input
                className="flex-grow p-4 bg-surface text-on-surface border-none outline-none font-body placeholder:italic"
                placeholder="Scribe your address..."
                type="email"
              />
              <button
                className="bg-on-primary-container text-surface px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary transition-colors"
                type="submit"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-200 dark:bg-stone-800 w-full border-t-2 border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center py-12 px-4 space-y-4">
        <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-headline uppercase tracking-widest">
          Crest & Chronicle
        </div>
        <nav className="flex space-x-6">
          <a
            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-stone-600 dark:text-stone-400 font-serif text-sm italic hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Support
          </a>
        </nav>
        <p className="font-serif text-sm italic text-stone-700 dark:text-stone-300">
          © 1242 The Chronicler’s Ledger. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
