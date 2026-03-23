import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Grimoire',  to: '/grimoire'  },
  { label: 'Aptitude',  to: '/aptitude'  },
  { label: 'Dungeon',   to: '/dungeon'   },
  { label: 'Armory',    to: '/armory'    },
  { label: 'Shop',      to: '/shop'      },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const user         = JSON.parse(localStorage.getItem('user') || 'null');

  function handleAccount() {
    if (user) navigate('/profile');
    else navigate('/login');
  }

  return (
    <header className="bg-orange-50 border-b-4 border-yellow-900 shadow-[4px_4px_0px_0px_rgba(31,28,11,1)] flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
      {/* Brand */}
      <Link
        to="/"
        className="text-2xl font-black text-yellow-900 font-serif uppercase tracking-widest hover:opacity-80 transition-opacity"
      >
        The Chronicler's Ledger
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
              <button
                onClick={handleAccount}
                className="material-symbols-outlined text-yellow-900 p-2 active:translate-y-0.5 transition-transform hover:bg-orange-100 rounded-none"
                title={user.username}
              >
                account_circle
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
    </header>
  );
}
