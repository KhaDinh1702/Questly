import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import frameMonthly1 from '../assets/images/frames/frame_monthly_1.png';
import frame6Months1 from '../assets/images/frames/frame_6months_1.png';

const NAV_LINKS = [
  { label: 'Grimoire',  to: '/grimoire'  },
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

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarIcon, setAvatarIcon] = useState(user?.avatarIcon || AVATAR_ICONS[0].id);
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || DEFAULT_COLOR_HEX);
  const [showFrame, setShowFrame] = useState(user?.showFrame ?? true);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(updatedUser);
      if (updatedUser) {
        setAvatarIcon(updatedUser.avatarIcon || AVATAR_ICONS[0].id);
        setAvatarColor(updatedUser.avatarColor || DEFAULT_COLOR_HEX);
        setShowFrame(updatedUser.showFrame ?? true);
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

  const isPremium = user && (user.subscriptionTier === 'monthly' || user.subscriptionTier === '6months' || user.subscriptionTier === 'yearly');
  
  const getFrameAsset = (tier) => {
    if (tier === '6months') return frame6Months1;
    if (tier === 'yearly') return frame6Months1; // Placeholder for now or use same as 6m
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
      const res = await userApi.updateAvatar({ avatarIcon, avatarColor, showFrame });
      if (res.data) {
        const updatedUser = { ...user, avatarIcon, avatarColor, showFrame };
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
                      src={getFrameAsset(user.subscriptionTier)} 
                      alt="" 
                      className="w-full h-full object-contain scale-110"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}
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
                      src={getFrameAsset(user.subscriptionTier)} 
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
