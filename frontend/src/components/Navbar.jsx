import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { userApi } from '../services/api';

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

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const user         = JSON.parse(localStorage.getItem('user') || 'null');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarIcon, setAvatarIcon] = useState(user?.avatarIcon || 'warrior');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || 'blue');

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
      await userApi.updateAvatar({ avatarIcon, avatarColor });
      const updatedUser = { ...user, avatarIcon, avatarColor };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowAvatarModal(false);
    } catch (e) {
      console.error('Failed to update avatar:', e);
    }
  }

  const currentAvatarObj = AVATAR_ICONS.find(a => a.id === avatarIcon) || AVATAR_ICONS[0];
  const currentColorObj = AVATAR_COLORS.find(c => c.id === avatarColor) || AVATAR_COLORS[0];

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
              <button
                onClick={() => setShowAvatarModal(true)}
                className={`${currentColorObj.bg} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold border-2 border-white shadow-md hover:shadow-lg hover:scale-105 transition-all active:translate-y-0.5`}
                title="Change Avatar"
              >
                <span className="material-symbols-outlined text-2xl">{currentAvatarObj.icon}</span>
              </button>

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
              <div className={`${AVATAR_COLORS.find(c => c.id === avatarColor)?.bg} w-24 h-24 rounded-xl flex items-center justify-center text-white border-4 border-white shadow-lg`}>
                <span className="material-symbols-outlined text-6xl">{AVATAR_ICONS.find(a => a.id === avatarIcon)?.icon}</span>
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
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAvatarColor(color.id)}
                    className={`w-12 h-12 rounded-lg ${color.bg} border-4 transition-all ${
                      avatarColor === color.id
                        ? 'border-yellow-900 scale-110 shadow-lg'
                        : 'border-transparent hover:shadow-md'
                    }`}
                    title={color.id}
                  />
                ))}
              </div>
            </div>

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
