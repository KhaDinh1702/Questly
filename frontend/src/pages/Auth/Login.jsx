import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-900 font-body text-on-surface m-0 p-0 min-h-screen flex items-center justify-center stone-wall overflow-hidden">
      <main className="relative z-10 w-full max-w-lg px-4 flex justify-center">
        <div className="relative w-full parchment-texture p-12 parchment-shadow border-x-[12px] border-surface-container-highest">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-tertiary rounded-full shadow-inner flex items-center justify-center border-2 border-stone-800">
            <div className="w-1 h-1 bg-stone-400 rounded-full"></div>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-headline font-extrabold text-4xl uppercase tracking-tighter text-primary mb-2">
              Crest & Chronicle
            </h1>
            <div className="w-24 h-0.5 bg-outline-variant mx-auto mb-6"></div>
            <h2 className="font-headline text-2xl text-on-surface-variant italic">Seeker's Admittance</h2>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-3 mb-6 border-l-4 border-error text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <label className="block font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-1" htmlFor="username">
                Adventurer Name
              </label>
              <div className="flex items-center border-b-2 border-outline focus-within:border-primary-container transition-colors py-2">
                <span className="material-symbols-outlined text-outline mr-3">person</span>
                <input
                  className="bg-transparent border-none focus:ring-0 w-full text-lg placeholder:text-outline-variant placeholder:italic font-body outline-none"
                  id="username"
                  name="username"
                  placeholder="Thistle of the Glen"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block font-headline font-bold text-sm uppercase tracking-widest text-on-surface-variant mb-1" htmlFor="password">
                Secret Rune
              </label>
              <div className="flex items-center border-b-2 border-outline focus-within:border-primary-container transition-colors py-2">
                <span className="material-symbols-outlined text-outline mr-3">key</span>
                <input
                  className="bg-transparent border-none focus:ring-0 w-full text-lg placeholder:text-outline-variant font-body outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-label uppercase tracking-tighter text-on-surface-variant">
              <label className="flex items-center cursor-pointer">
                <input className="w-4 h-4 bg-surface-container border-outline text-primary focus:ring-primary-container rounded-none mr-2" type="checkbox" />
                <span>Keep Ledger Logged</span>
              </label>
              <a className="hover:text-primary underline underline-offset-2" href="#">Lost Rune?</a>
            </div>

            <button
              className={`w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold text-xl py-5 transition-all active:translate-y-1 carved-bevel uppercase tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Entering...' : 'Enter the Tavern'}
            </button>
          </form>

          <div className="relative my-10 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <span className="relative px-4 parchment-texture text-xs font-label italic text-outline uppercase tracking-widest">
              Or via magical bond
            </span>
          </div>

          <div className="flex justify-center">
            <button className="group flex items-center bg-stone-200 hover:bg-stone-300 transition-colors pixel-border px-6 py-3 space-x-4">
              <div className="w-6 h-6 flex flex-wrap gap-0.5">
                <div className="w-1.5 h-1.5 bg-red-600"></div><div className="w-1.5 h-1.5 bg-red-600"></div><div className="w-1.5 h-1.5 bg-red-600"></div><div className="w-1.5 h-1.5 bg-red-600"></div>
                <div className="w-1.5 h-1.5 bg-red-600"></div><div className="w-1.5 h-1.5 invisible"></div><div className="w-1.5 h-1.5 invisible"></div><div className="w-1.5 h-1.5 invisible"></div>
                <div className="w-1.5 h-1.5 bg-blue-600"></div><div className="w-1.5 h-1.5 invisible"></div><div className="w-1.5 h-1.5 bg-blue-600"></div><div className="w-1.5 h-1.5 bg-blue-600"></div>
                <div className="w-1.5 h-1.5 bg-yellow-600"></div><div className="w-1.5 h-1.5 invisible"></div><div className="w-1.5 h-1.5 invisible"></div><div className="w-1.5 h-1.5 bg-blue-600"></div>
                <div className="w-1.5 h-1.5 bg-green-600"></div><div className="w-1.5 h-1.5 bg-green-600"></div><div className="w-1.5 h-1.5 bg-green-600"></div><div className="w-1.5 h-1.5 bg-green-600"></div>
              </div>
              <span className="font-mono text-sm font-bold text-stone-700 uppercase tracking-tighter">Sign with Google</span>
            </button>
          </div>

          <div className="mt-12 text-center text-sm">
            <p className="text-on-surface-variant font-body">
              New to the realm? 
              <Link className="font-headline font-bold text-primary hover:underline ml-1" to="/register">Join the Registry</Link>
            </p>
          </div>
        </div>

        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-red-800 rotate-12 flex items-center justify-center shadow-lg border-4 border-red-950">
          <span className="material-symbols-outlined text-red-100 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-stone-900/80 backdrop-blur-sm border-t-2 border-amber-950 py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-500 font-serif text-xs italic">
        <div>© 1242 The Chronicler’s Ledger. All rights reserved.</div>
        <div className="flex gap-6">
          <a className="hover:text-amber-500 transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-amber-500 transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-amber-500 transition-colors" href="#">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
