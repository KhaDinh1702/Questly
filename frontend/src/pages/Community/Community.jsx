import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Navbar from '../../components/Navbar';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { communityApi } from '../../services/api';
import { getIdentityTitle, getNameRarity, getRarityTextClass } from '../../utils/identity';
import tavernBg from '../../assets/images/background/tarvern.png';

const tavernImageUrl = tavernBg;

const AVATAR_ICON_TO_SYMBOL = {
  warrior: 'shield',
  mage: 'auto_fix_high',
  rogue: 'speed',
  archer: 'track_changes',
  knight: 'verified_user',
  ranger: 'nature',
  wizard: 'psychology',
  dragon: 'local_fire_department',
};

function pad4(v) {
  return String(v ?? '0000').padStart(4, '0');
}

function relationshipActionLabel(relationship) {
  if (relationship === 'friend') return 'Remove';
  if (relationship === 'outgoing') return 'Requested';
  if (relationship === 'incoming') return 'Respond';
  if (relationship === 'self') return 'You';
  return 'Add';
}

export default function Community() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'friends'
  const [players, setPlayers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reqCount, setReqCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refreshAll() {
    setLoading(true);
    setError('');
    try {
      const [playersRes, friendsRes, reqRes] = await Promise.all([
        communityApi.getPlayers({ limit: 100 }),
        communityApi.getFriends(),
        communityApi.getRequests(),
      ]);
      setPlayers(playersRes.data?.players ?? []);
      setFriends(friendsRes.data?.friends ?? []);
      setRequests(reqRes.data?.requests ?? []);
      setReqCount(reqRes.data?.count ?? 0);
    } catch (e) {
      setError(e.response?.data?.error ?? 'Failed to load community data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const friendBadge = useMemo(() => {
    if (reqCount > 0) return reqCount;
    if (friends.length > 0) return friends.length;
    return 0;
  }, [friends.length, reqCount]);

  async function handleAction(p) {
    if (!p?._id) return;
    if (p.relationship === 'self') return;
    try {
      if (p.relationship === 'friend') {
        await communityApi.removeFriend(p._id);
      } else if (p.relationship === 'outgoing') {
        // no-op for now
        return;
      } else if (p.relationship === 'incoming') {
        // switch to Friends tab so they can accept/decline
        setActiveTab('friends');
        return;
      } else {
        await communityApi.requestFriend(p._id);
      }
      await refreshAll();
    } catch (e) {
      setError(e.response?.data?.error ?? 'Action failed.');
    }
  }

  async function accept(fromUserId) {
    try {
      await communityApi.acceptRequest(fromUserId);
      await refreshAll();
    } catch (e) {
      setError(e.response?.data?.error ?? 'Failed to accept request.');
    }
  }

  async function decline(fromUserId) {
    try {
      await communityApi.declineRequest(fromUserId);
      await refreshAll();
    } catch (e) {
      setError(e.response?.data?.error ?? 'Failed to decline request.');
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1410] relative overflow-hidden">
      <Navbar />

      <div className="absolute inset-0">
        <ImageWithFallback
          src={tavernImageUrl}
          alt="Medieval Tavern"
          className="w-full h-full object-cover opacity-30"
          style={{
            imageRendering: 'pixelated',
            filter: 'contrast(1.3) brightness(0.6) sepia(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#1a1410]/60 to-[#1a1410]/90" />
      </div>

      <motion.div
        className="absolute inset-0 bg-gradient-radial from-[#ff8c00]/5 to-transparent"
        animate={{ opacity: [0.3, 0.5, 0.4, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='2' height='2' fill='%23c4a35a'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23c4a35a'/%3E%3C/svg%3E\")`,
          imageRendering: 'pixelated',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1
            className="text-4xl sm:text-5xl md:text-6xl text-[#c4a35a] font-serif tracking-wider mb-2"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '0 0 20px rgba(196,163,90,0.6), 2px 2px 0 #5a4a35',
            }}
          >
            THE TAVERN
          </h1>
          <p className="text-[#d4c4a8] text-lg">Gather with fellow Seekers</p>
        </motion.div>

        {reqCount > 0 && (
          <div className="mb-4 bg-[#2a2418]/95 border-2 border-[#c4a35a] p-4 text-center text-[#d4c4a8]">
            <span className="font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              New friend request{reqCount > 1 ? 's' : ''}:
            </span>{' '}
            <span className="text-[#c4a35a] font-black">{reqCount}</span> — open the Friends tab to respond.
          </div>
        )}

        {error && (
          <div className="mb-4 bg-black/40 border-2 border-red-700 p-4 text-red-200 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-6 py-3 border-4 transition-all duration-300 ${
              activeTab === 'leaderboard'
                ? 'bg-[#8b7355] border-[#c4a35a] text-[#eae4d4]'
                : 'bg-[#2a2418]/80 border-[#5a4a35] text-[#8b7355] hover:border-[#8b7355]'
            }`}
            style={{ imageRendering: 'pixelated' }}
          >
            <span className="material-symbols-outlined text-[20px]">trophy</span>
            <span className="font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
              LEADERBOARD
            </span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-6 py-3 border-4 transition-all duration-300 relative ${
              activeTab === 'friends'
                ? 'bg-[#8b7355] border-[#c4a35a] text-[#eae4d4]'
                : 'bg-[#2a2418]/80 border-[#5a4a35] text-[#8b7355] hover:border-[#8b7355]'
            }`}
            style={{ imageRendering: 'pixelated' }}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
              FRIENDS
            </span>
            {friendBadge > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#c4a35a] text-[#1a1410] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {friendBadge}
              </span>
            )}
          </button>
        </div>

        <div className="relative bg-[#2a2418]/95 border-4 border-[#8b7355] shadow-2xl backdrop-blur-sm">
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="text-center py-16 text-[#8b7355] font-bold">Loading...</div>
            ) : activeTab === 'leaderboard' ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {players.map((p, idx) => {
                  const title = getIdentityTitle(p.level);
                  const rarity = getNameRarity(title);
                  const nameClass = getRarityTextClass(rarity);
                  return (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.02 }}
                      className="bg-black/30 border-2 border-[#5a4a35] p-4 hover:border-[#8b7355] transition-all duration-300"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border-2 border-[#c4a35a] bg-black/50 text-[#c4a35a]">
                          <span className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                            {idx + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-white/20"
                              style={{ backgroundColor: p.avatarColor ?? '#3B82F6' }}
                              title="Avatar"
                            >
                              <span className="material-symbols-outlined text-white">
                                {AVATAR_ICON_TO_SYMBOL[p.avatarIcon] ?? 'account_circle'}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className={`font-black truncate ${nameClass}`}>
                                {p.username}#{pad4(p.identityId)}
                              </div>
                              <div className="text-xs text-[#8b7355]">
                                <span className="uppercase font-bold">{title}</span> • Level {p.level} •{' '}
                                {p.class ?? 'NOVICE'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className="text-2xl font-bold text-[#c4a35a]"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            {(p.totalScore ?? 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-[#8b7355]">SCORE</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAction(p)}
                          disabled={p.relationship === 'self' || p.relationship === 'outgoing'}
                          className={`flex-shrink-0 px-4 py-2 border-2 font-bold uppercase text-xs transition-all ${
                            p.relationship === 'friend'
                              ? 'bg-[#c4a35a] border-[#c4a35a] text-[#1a1410]'
                              : p.relationship === 'outgoing'
                                ? 'bg-transparent border-[#5a4a35] text-[#5a4a35] opacity-70 cursor-not-allowed'
                                : p.relationship === 'self'
                                  ? 'bg-transparent border-[#5a4a35] text-[#5a4a35] opacity-70 cursor-not-allowed'
                                  : 'bg-transparent border-[#5a4a35] text-[#8b7355] hover:border-[#c4a35a]'
                          }`}
                          style={{ imageRendering: 'pixelated' }}
                          title={p.relationship}
                        >
                          {relationshipActionLabel(p.relationship)}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                {requests.length > 0 && (
                  <div>
                    <div className="text-[#c4a35a] font-black uppercase tracking-widest text-xs mb-3">
                      Friend Requests
                    </div>
                    <div className="space-y-3">
                      {requests.map((r) => {
                        const p = r.from;
                        const title = getIdentityTitle(p.level);
                        const rarity = getNameRarity(title);
                        const nameClass = getRarityTextClass(rarity);
                        return (
                          <div
                            key={p._id}
                            className="bg-black/30 border-2 border-[#5a4a35] p-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className={`font-black truncate ${nameClass}`}>
                                {p.username}#{pad4(p.identityId)}
                              </div>
                              <div className="text-xs text-[#8b7355]">
                                <span className="uppercase font-bold">{title}</span> • Level {p.level}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => accept(p._id)}
                                className="px-4 py-2 border-2 border-[#c4a35a] bg-[#c4a35a] text-[#1a1410] font-black uppercase text-xs"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => decline(p._id)}
                                className="px-4 py-2 border-2 border-[#5a4a35] text-[#8b7355] font-black uppercase text-xs hover:border-[#c4a35a]"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[#c4a35a] font-black uppercase tracking-widest text-xs mb-3">Your Friends</div>
                  {friends.length === 0 ? (
                    <div className="text-center py-16 text-[#8b7355]">
                      <div className="text-xl mb-2">No friends yet</div>
                      <div className="text-[#5a4a35]">Add friends from the leaderboard.</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                      {friends.map((p) => {
                        const title = getIdentityTitle(p.level);
                        const rarity = getNameRarity(title);
                        const nameClass = getRarityTextClass(rarity);
                        return (
                          <div
                            key={p._id}
                            className="bg-black/30 border-2 border-[#5a4a35] p-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className={`font-black truncate ${nameClass}`}>
                                {p.username}#{pad4(p.identityId)}
                              </div>
                              <div className="text-xs text-[#8b7355]">
                                <span className="uppercase font-bold">{title}</span> • Level {p.level} •{' '}
                                {(p.totalScore ?? 0).toLocaleString()} pts
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => communityApi.removeFriend(p._id).then(refreshAll).catch(() => {})}
                              className="px-4 py-2 border-2 border-[#c4a35a] bg-[#c4a35a] text-[#1a1410] font-black uppercase text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-8 text-center">
          <div className="bg-black/40 border-2 border-[#5a4a35] px-6 py-3">
            <div className="text-2xl font-bold text-[#c4a35a]" style={{ fontFamily: "'Cinzel', serif" }}>
              {players.length}
            </div>
            <div className="text-xs text-[#8b7355]">TOTAL SEEKERS</div>
          </div>
          <div className="bg-black/40 border-2 border-[#5a4a35] px-6 py-3">
            <div className="text-2xl font-bold text-[#c4a35a]" style={{ fontFamily: "'Cinzel', serif" }}>
              {friends.length}
            </div>
            <div className="text-xs text-[#8b7355]">YOUR FRIENDS</div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a1410; border: 1px solid #5a4a35; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8b7355; border: 1px solid #c4a35a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c4a35a; }
      `}</style>
    </div>
  );
}

