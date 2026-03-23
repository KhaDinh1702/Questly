import { useState } from 'react';
import Navbar from '../../components/Navbar';

export default function Armory() {
  const [selectedClass, setSelectedClass] = useState('WARRIOR');

  return (
    <div className="bg-background text-on-surface font-body min-h-screen pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Character Sprite & Class Selection */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container border-4 border-on-surface p-1 shadow-[8px_8px_0px_0px_rgba(31,28,11,1)]">
            <div 
              className="bg-surface-container-highest border-2 border-outline p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 2px, transparent 2px, transparent 4px)' }}
            >
              {/* Character Display */}
              <div className="relative z-10 scale-[2.5] mb-8">
                <span className="material-symbols-outlined text-primary text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_play</span>
              </div>
              
              {/* Class Selection Tabs */}
              <div className="w-full flex justify-center gap-2 mt-auto">
                {['WARRIOR', 'ROGUE', 'MAGE'].map((cls) => (
                  <button 
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 py-2 font-headline font-bold border-2 active:translate-y-0.5 transition-all
                      ${selectedClass === cls 
                        ? 'bg-primary text-on-primary border-on-primary-container shadow-[2px_2px_0px_0px_rgba(72,50,0,1)]' 
                        : 'bg-surface-container-low text-primary border-outline shadow-[2px_2px_0px_0px_rgba(128,118,102,1)] hover:bg-surface-container-high'
                      }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              
              {/* Visual Accent: Page Fold */}
              <div 
                className="absolute top-0 right-0 w-12 h-12 bg-surface-dim shadow-[-2px_2px_0px_0px_rgba(0,0,0,0.1)]" 
                style={{ clipPath: 'polygon(0 0, 100% 100%, 100% 0)' }}
              ></div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-surface-container p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
            <h2 className="font-headline text-2xl font-extrabold text-primary mb-4 border-b-2 border-primary-container pb-2">
              CHARACTER ATTRIBUTES
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-outline uppercase tracking-tighter">Level</span>
                <span className="font-headline text-xl font-bold">42 <span className="text-sm font-normal text-tertiary">(Vanguard)</span></span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-outline uppercase tracking-tighter">Experience</span>
                <span className="font-headline text-xl font-bold">12,450 / 15,000</span>
              </div>
              <div className="col-span-2 bg-surface-variant h-3 border border-outline relative">
                <div className="absolute inset-0 bg-primary-container w-[83%]"></div>
              </div>
              
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">Health</span>
                <span className="font-headline font-bold text-error">840/840</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">Defense</span>
                <span className="font-headline font-bold text-tertiary">152</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">Atk Speed</span>
                <span className="font-headline font-bold">1.2s</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant py-1">
                <span className="text-sm font-bold uppercase">Crit Chance</span>
                <span className="font-headline font-bold">8.5%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Inventory & Equipment */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Equipment Slots */}
          <div className="bg-surface-container-high p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)]">
            <h2 className="font-headline text-2xl font-extrabold text-primary mb-6">CURRENTLY EQUIPPED</h2>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {[
                { label: 'Head', icon: 'chef_hat', bgIcon: 'skull' },
                { label: 'Main Hand', icon: 'swords' },
                { label: 'Off Hand', icon: 'shield' },
                { label: 'Torso', icon: 'apparel' },
              ].map((slot, i) => (
                <div key={i} className="group flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-surface-variant border-2 border-outline flex items-center justify-center relative shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)]">
                    {slot.bgIcon && (
                      <span className="material-symbols-outlined text-outline text-3xl opacity-30">
                        {slot.bgIcon}
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-fixed/20">
                      <span className="material-symbols-outlined text-on-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {slot.icon}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-outline uppercase">{slot.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="bg-surface-container p-6 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] relative overflow-hidden">
            <div className="flex justify-between items-end mb-6">
              <h2 className="font-headline text-3xl font-extrabold text-primary">LEATHER RUCKSACK</h2>
              <span className="text-xs font-bold text-outline-variant uppercase bg-on-surface px-2 py-1 text-surface">
                Capacity: 12/16
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto lg:mx-0">
              {/* Row 1 */}
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-primary text-3xl">skillet</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border border-on-primary-container rounded-full"></div>
              </div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-primary text-3xl">shield</span>
              </div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>vital_signs</span>
              </div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-primary text-3xl">auto_stories</span>
              </div>

              {/* Row 2 */}
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-primary text-3xl">key</span>
              </div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <span className="material-symbols-outlined text-tertiary text-3xl">token</span>
              </div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"></div>
              <div className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"></div>

              {/* Empty Slots */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-surface-variant border-2 border-outline p-2 relative group cursor-pointer hover:bg-surface-container-highest transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"></div>
              ))}
            </div>

            {/* Item Detail Tooltip Simulation */}
            <div className="mt-6 p-4 border-2 border-primary bg-surface-container-low">
              <h3 className="font-headline font-bold text-lg text-on-surface">Rusty Blade</h3>
              <p className="text-xs italic text-on-surface-variant mb-2">"A jagged relic of a forgotten skirmish."</p>
              <div className="flex gap-4">
                <span className="text-[10px] font-bold uppercase text-primary">+12 Attack</span>
                <span className="text-[10px] font-bold uppercase text-tertiary">-5% Speed</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
