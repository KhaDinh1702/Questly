import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import frameMonthly1 from '../assets/images/frames/frame_monthly_1.png';
import frame6Months1 from '../assets/images/frames/frame_6months_1.png';
import frame1Year1 from '../assets/images/frames/frame_1year_1.png';
import frame1Year2 from '../assets/images/frames/frame_1year_2.png';

const NAV_LINKS = [
  { label: 'Grimoire',  to: '/grimoire'  },
  { label: 'Community', to: '/community' },
  { label: 'Aptitude',  to: '/aptitude'  },
  { label: 'Dungeon',   to: '/dungeon'   },
  { label: 'Armory',    to: '/armory'    },
  { label: 'Shop',      to: '/shop'      },
  { label: 'Pricing',   to: '/pricing'   },
];

const AVATAR_ICONS = [
  { id: 'warrior', icon: 'shield', label: 'Warrior' },
  { id: 'mage', icon: 'auto_fix_high', label: 'Mage' },
  { id: 'rogue', icon: 'speed', label: 'Rogue' },
  { id: 'archer', icon: 'track_changes', label: 'Archer' },
  { id: 'knight', icon: 'verified_user', label: 'Knight' },
  { id: 'ranger', icon: 'nature', label: 'Ranger' },
  { id: 'wizard', icon: 'psychology', label: 'Wizard' },
  { id: 'dragon', icon: 'local_fire_department', label: 'Dragon' },
];

const AVATAR_COLORS = [
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'green', bg: 'bg-green-500' },
  { id: 'purple', bg: 'bg-purple-500' },
  { id: 'yellow', bg: 'bg-yellow-500' },
  { id: 'pink', bg: 'bg-pink-500' },
  { id: 'cyan', bg: 'bg-cyan-500' },
  { id: 'orange', bg: 'bg-orange-500' },
];

// Default hex colors
const DEFAULT_COLOR_HEX = '#3B82F6'; // blue

function getIdentityTitle(level = 1) {
  const lv = Number(level) || 1;
  if (lv >= 50) return 'SS Rank Hunter';
  if (lv >= 31) return 'Boss Killer';
  if (lv >= 21) return 'Dungeon Slayer';
  if (lv >= 11) return 'Explorer';
  return 'Novice';
}

function getNameRarity(title) {
  if (title === 'SS Rank Hunter') return 'ss';
  if (title === 'Boss Killer') return 'legendary';
  if (title === 'Dungeon Slayer') return 'epic';
  if (title === 'Explorer') return 'rare';
  return 'common';
}

function getRarityTextClass(rarity) {
  switch (rarity) {
    case 'rare':
      return 'text-blue-600';
    case 'epic':
      return 'text-purple-700';
    case 'legendary':
      return 'text-yellow-700';
    case 'ss':
      return 'text-red-700';
    default:
      return 'text-stone-800';
  }
}

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarIcon, setAvatarIcon] = useState(user?.avatarIcon || AVATAR_ICONS[0].id);
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || DEFAULT_COLOR_HEX);
  const [showFrame, setShowFrame] = useState(user?.showFrame ?? true);
  const [selectedFrame, setSelectedFrame] = useState(user?.selectedFrame ?? null);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updatedUser);
      if (updatedUser) {
        setAvatarIcon(updatedUser.avatarIcon || AVATAR_ICONS[0].id);
        setAvatarColor(updatedUser.avatarColor || DEFAULT_COLOR_HEX);
        setShowFrame(updatedUser.showFrame ?? true);
        setSelectedFrame(updatedUser.selectedFrame ?? null);
      }
    };
    
    // Listen for custom dispatch and storage cross-tab events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  // Hydrate identityId/level from backend (so Navbar always has real data)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!user) return;
    userApi.getMe().then((res) => {
      const me = res.data ?? {};
      const merged = { ...user, ...me };
      localStorage.setItem('user', JSON.stringify(merged));
      setUser(merged);
      setSelectedFrame(merged.selectedFrame ?? null);
      window.dispatchEvent(new Event('userUpdated'));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPremium = user && (user.subscriptionTier === 'monthly' || user.subscriptionTier === '6months' || user.subscriptionTier === 'yearly');
  
  const getFrameAsset = (tier, picked) => {
    if (tier === 'yearly') {
      if (picked === '1year_2') return frame1Year2;
      return frame1Year1;
    }
    if (tier === '6months') return frame6Months1;
    return frameMonthly1;
  };

  function handleAccount() {
    if (user) navigate('/profile');
    else navigate('/login');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function saveAvatar() {
    try {
      const res = await userApi.updateAvatar({ avatarIcon, avatarColor, showFrame, selectedFrame });
      if (res.data) {
        const updatedUser = { ...user, avatarIcon, avatarColor, showFrame, selectedFrame };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowAvatarModal(false);
        window.dispatchEvent(new Event('userUpdated'));
      }
    } catch (e) {
      console.error('Failed to update avatar:', e);
    }
  }

  const currentAvatarObj = AVATAR_ICONS.find(a => a.id === avatarIcon) || AVATAR_ICONS[0];
  const identityTitle = getIdentityTitle(user?.level);
  const rarity = getNameRarity(identityTitle);
  const nameClass = getRarityTextClass(rarity);
  const displayId = (user?.identityId ?? '0000').toString().padStart(4, '0');

  return (
    <header className="bg-orange-50 border-b-4 border-yellow-900 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
      {/* Brand */}
      <Link
        to="/"
        className="text-2xl font-black text-yellow-900 font-serif uppercase tracking-widest hover:opacity-80 transition-opacity"
      >
        Questly
      </Link>

      {/* Desktop nav */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-8 items-center">
          {NAV_LINKS.map(({ label, to }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`font-serif text-sm uppercase tracking-wider px-2 py-1 transition-all
                  ${active
                    ? 'text-yellow-700 font-bold border-b-2 border-yellow-700'
                    : 'text-stone-600 hover:bg-orange-100 hover:text-yellow-900'
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Icon buttons / Auth Links */}
        <div className="flex gap-2 items-center">
          {user ? (
            <>
              <button
                className="material-symbols-outlined text-yellow-900 p-2 active:translate-y-0.5 transition-transform hover:bg-orange-100 rounded-none"
                title="Notifications"
              >
                notifications
              </button>

              {/* Square Avatar with Icon Selection */}
              <div className="relative">
                <button
                  onClick={() => setShowAvatarModal(true)}
                  style={{ backgroundColor: avatarColor }}
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold border-2 border-white shadow-md hover:shadow-lg hover:scale-105 transition-all active:translate-y-0.5"
                  title="Change Avatar"
                >
                  <span className="material-symbols-outlined text-2xl">{currentAvatarObj.icon}</span>
                </button>
                {isPremium && user.showFrame !== false && (
                  <div className="absolute -inset-2 pointer-events-none">
                    <img 
                      src={getFrameAsset(user.subscriptionTier, user.selectedFrame)} 
                      alt="" 
                      className="w-full h-full object-contain scale-110"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}
              </div>

              {/* Username & Identity */}
              <div className="hidden lg:flex flex-col leading-tight select-none mr-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  {identityTitle}
                </div>
                <div className={`text-sm font-black font-serif tracking-wide ${nameClass}`}>
                  {user.username}#{displayId}
                </div>
              </div>

              <button
                onClick={handleAccount}
                className="material-symbols-outlined text-yellow-900 p-2 active:translate-y-0.5 transition-transform hover:bg-orange-100 rounded-none"
                title={user.username}
              >
                settings
              </button>
              <button
                onClick={handleLogout}
                className="material-symbols-outlined text-yellow-900 p-2 active:translate-y-0.5 transition-transform hover:bg-error-container hover:text-error rounded-none ml-2"
                title="Logout"
              >
                logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 text-sm font-serif uppercase tracking-wider">
              <Link to="/login" className="text-stone-600 hover:text-yellow-900 transition-colors">
                Login
              </Link>
              <Link to="/register" className="bg-yellow-900 text-orange-50 px-4 py-2 hover:bg-yellow-800 transition-colors border-2 border-yellow-900 active:translate-y-0.5">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile hamburger (hidden on md+) */}
      <button className="md:hidden material-symbols-outlined text-yellow-900 p-2">
        menu
      </button>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-orange-50 border-4 border-yellow-900 rounded-lg p-6 max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(31,28,11,1)]">
            <h2 className="font-serif text-2xl font-black text-yellow-900 mb-6 uppercase">Choose Your Avatar</h2>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div style={{ backgroundColor: avatarColor }} className="w-24 h-24 rounded-xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                  <span className="material-symbols-outlined text-6xl">{AVATAR_ICONS.find(a => a.id === avatarIcon)?.icon}</span>
                </div>
                {isPremium && showFrame && (
                  <div className="absolute -inset-4 pointer-events-none">
                    <img 
                      src={getFrameAsset(user.subscriptionTier, selectedFrame)} 
                      alt="" 
                      className="w-full h-full object-contain scale-110"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="mb-6">
              <p className="font-serif font-bold text-yellow-900 mb-3 uppercase">Icon</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_ICONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setAvatarIcon(avatar.id)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all border-2 ${
                      avatarIcon === avatar.id
                        ? 'border-yellow-900 bg-yellow-100 text-yellow-900 scale-110'
                        : 'border-stone-300 bg-white text-stone-600 hover:border-yellow-900'
                    }`}
                    title={avatar.label}
                  >
                    <span className="material-symbols-outlined">{avatar.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <p className="font-serif font-bold text-yellow-900 mb-3 uppercase">Color</p>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={avatarColor.startsWith('#') || avatarColor.startsWith('rgb') ? avatarColor : DEFAULT_COLOR_HEX}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  className="w-16 h-16 p-1 rounded-lg border-2 border-yellow-900 cursor-pointer"
                  title="Choose Avatar Color"
                />
                <span className="font-mono text-stone-600 uppercase bg-white px-3 py-1 rounded border border-stone-300">
                  {avatarColor}
                </span>
              </div>
            </div>

            {/* Premium Frame Toggle */}
            {isPremium && (
              <div className="mb-6 flex items-center gap-2 bg-yellow-50 p-4 border-2 border-yellow-200 rounded-lg">
                <input
                  id="showFrameToggle"
                  type="checkbox"
                  checked={showFrame}
                  onChange={(e) => setShowFrame(e.target.checked)}
                  className="w-5 h-5 accent-yellow-900 cursor-pointer"
                />
                <label htmlFor="showFrameToggle" className="font-serif font-bold text-yellow-900 uppercase cursor-pointer select-none">
                  Display Premium Frame
                </label>
              </div>
            )}

            {/* Yearly Frame Variant */}
            {isPremium && user?.subscriptionTier === 'yearly' && (
              <div className="mb-6 bg-yellow-50 p-4 border-2 border-yellow-200 rounded-lg">
                <p className="font-serif font-bold text-yellow-900 uppercase mb-3">Frame Style</p>
                <div className="flex items-center gap-4">
                  {[
                    { id: '1year_1', img: frame1Year1, label: 'Frame I' },
                    { id: '1year_2', img: frame1Year2, label: 'Frame II' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFrame(f.id)}
                      className={`relative w-20 h-20 border-2 rounded-lg bg-white transition-all ${
                        selectedFrame === f.id ? 'border-yellow-900 scale-105' : 'border-stone-300 hover:border-yellow-900'
                      }`}
                      title={f.label}
                    >
                      <img src={f.img} alt={f.label} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-600 mt-3">
                  Your yearly subscription grants two frames. Choose one to display.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-6 py-2 border-2 border-yellow-900 text-yellow-900 font-serif font-bold rounded uppercase hover:bg-orange-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAvatar}
                className="px-6 py-2 bg-yellow-900 text-orange-50 font-serif font-bold rounded uppercase hover:bg-yellow-800 transition-colors border-2 border-yellow-900 active:translate-y-0.5"
              >
                Save Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
