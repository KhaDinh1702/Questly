import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { userApi } from '../../services/api';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { getPostAuthRoute } from '../../utils/onboarding';

const ARCHIVE_BG = '/images/warden-archive.png';

export default function WardenIntro() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    userApi
      .getMe()
      .then((res) => {
        const me = res.data ?? {};
        if (me.classProfile?.confirmedClass) {
          navigate(getPostAuthRoute(me), { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  async function continueJourney() {
    try {
      const { data } = await userApi.getMe();
      if (!data?.classProfile?.confirmedClass) navigate('/character-selection');
      else navigate(getPostAuthRoute(data));
    } catch {
      navigate('/character-selection');
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1410] relative overflow-hidden flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0">
        <ImageWithFallback
          src={ARCHIVE_BG}
          alt="The Last Archive"
          className="w-full h-full object-cover opacity-40"
          style={{
            imageRendering: 'pixelated',
            filter: 'contrast(1.2) brightness(0.7)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1410]/50 to-[#1a1410]/80" />
      </div>

      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(196,163,90,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='2' height='2' fill='%23c4a35a'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23c4a35a'/%3E%3C/svg%3E")`,
          imageRendering: 'pixelated',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-3xl w-full"
      >
        <div className="relative bg-[#2a2418]/95 border-4 border-[#8b7355] shadow-2xl backdrop-blur-sm">
          <div
            className="absolute -top-2 -left-2 w-8 h-8 border-4 border-[#c4a35a]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 30%, 30% 30%, 30% 100%, 0 100%)',
              imageRendering: 'pixelated',
            }}
          />
          <div
            className="absolute -top-2 -right-2 w-8 h-8 border-4 border-[#c4a35a]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 70% 100%, 70% 30%, 0 30%)',
              imageRendering: 'pixelated',
            }}
          />
          <div
            className="absolute -bottom-2 -left-2 w-8 h-8 border-4 border-[#c4a35a]"
            style={{
              clipPath: 'polygon(0 0, 30% 0, 30% 70%, 100% 70%, 100% 100%, 0 100%)',
              imageRendering: 'pixelated',
            }}
          />
          <div
            className="absolute -bottom-2 -right-2 w-8 h-8 border-4 border-[#c4a35a]"
            style={{
              clipPath: 'polygon(70% 0, 100% 0, 100% 100%, 0 100%, 0 70%, 70% 70%)',
              imageRendering: 'pixelated',
            }}
          />

          <div className="p-8 sm:p-12 md:p-16">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-[#c4a35a] mb-8"
              style={{ imageRendering: 'pixelated' }}
            />

            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative mb-10"
            >
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#c4a35a] font-serif text-center tracking-wider relative"
                style={{
                  fontFamily: "'Cinzel', serif",
                  textShadow: '0 0 20px rgba(196,163,90,0.6), 2px 2px 0 #5a4a35, 4px 4px 0 #3a2a15',
                }}
              >
                THE LAST ARCHIVE
              </h1>
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-16 h-1 bg-[#c4a35a]"
                style={{ imageRendering: 'pixelated' }}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 w-16 h-1 bg-[#c4a35a]"
                style={{ imageRendering: 'pixelated' }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="space-y-6 text-[#d4c4a8] mb-10"
            >
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-base sm:text-lg md:text-xl leading-relaxed text-center px-4"
              >
                <span className="text-[#c4a35a] font-bold text-xl sm:text-2xl">G</span>rimoire Realm was once a
                sanctuary of knowledge and peace, where ancient towers stood as beacons of learning. Until the day
                known as{' '}
                <span className="text-[#c4a35a] font-semibold italic">The Shattering of Knowledge</span>.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="text-base sm:text-lg md:text-xl leading-relaxed text-center px-4"
              >
                Entities from the void invaded our realm, breaking humanity&apos;s wisdom into scattered fragments.
                These creatures cannot create—only steal, corrupt, and offer their spoils to the{' '}
                <span className="text-[#8b7355] italic">Outer Gods</span>.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="text-base sm:text-lg md:text-xl leading-relaxed text-center px-4"
              >
                The fragments now gather within deadly Dungeons, guarded by corrupted beasts. As a newly appointed{' '}
                <span className="text-[#c4a35a] font-semibold">Seeker</span>, your sacred duty is to recover what was
                lost and restore the grimoires of old.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.5 }}
                className="relative mt-10 border-4 border-[#c4a35a] bg-black/40 p-6 sm:p-8"
                style={{ imageRendering: 'pixelated' }}
              >
                <div className="absolute top-0 left-0 w-2 h-2 bg-[#c4a35a]" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-[#c4a35a]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#c4a35a]" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#c4a35a]" />

                <p className="text-lg sm:text-xl md:text-2xl text-center italic text-[#c4a35a] leading-relaxed">
                  &quot;Knowledge is power.
                  <br />
                  Power is survival.
                  <br />
                  Will you reclaim what was shattered?&quot;
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.7 }}
              className="h-1 bg-[#c4a35a] mb-8"
              style={{ imageRendering: 'pixelated' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.9 }}
              className="flex justify-center"
            >
              <motion.button
                type="button"
                onClick={continueJourney}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-[#c4a35a]/30 blur-xl"
                />

                <div
                  className="relative bg-[#8b7355] border-4 border-[#c4a35a] px-12 sm:px-16 md:px-20 py-4 sm:py-5 overflow-hidden"
                  style={{ imageRendering: 'pixelated' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c4a35a]/40 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 1,
                    }}
                  />

                  <span
                    className="relative z-10 text-xl sm:text-2xl md:text-3xl font-bold text-[#eae4d4] tracking-[0.3em]"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      textShadow: '2px 2px 0 #2a2418',
                    }}
                  >
                    CONTINUE
                  </span>

                  <div className="absolute top-0 left-0 w-2 h-2 bg-[#eae4d4]" />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#eae4d4]" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#eae4d4]" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#eae4d4]" />
                </div>
              </motion.button>
            </motion.div>
          </div>
        </div>

        <div className="absolute -inset-8 bg-[#c4a35a]/5 blur-3xl -z-10" />
      </motion.div>

      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-[#c4a35a]"
          style={{ imageRendering: 'pixelated' }}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, Math.random() * -300 - 100],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}

      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #c4a35a 2px, #c4a35a 4px)',
          imageRendering: 'pixelated',
        }}
        animate={{ opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}
