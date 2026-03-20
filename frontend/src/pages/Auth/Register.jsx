import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!termsAccepted) {
      setError('Bạn phải đồng ý với các điều khoản của vương quốc');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      setLoading(false);
      return;
    }

    try {
      // Backend uses 'username' as the unique identifier, so we map 'email' to 'username'
      await axios.post(`${apiUrl}/api/auth/register`, {
        username: email,
        password,
        fullName, // Optional: backend doesn't store this yet but it's good practice
      });

      setSuccess('Ghi danh thành công! Đang chuyển hướng tới Tavern...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ghi danh thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-dim font-body text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-amber-900 dark:bg-stone-900 border-b-4 border-amber-950 dark:border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3)] flex justify-between items-center w-full px-6 py-4 mx-auto sticky top-0 z-50">
        <div className="text-2xl font-black text-yellow-500 dark:text-yellow-400 drop-shadow-sm font-headline uppercase tracking-wide">
          Crest & Chronicle
        </div>
        <div className="flex gap-4">
          <Link
            className="font-headline font-bold uppercase tracking-wide text-sm text-yellow-100/80 hover:text-yellow-200 transition-colors duration-150 active:translate-y-0.5"
            to="/login"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-8 parchment-texture relative">
        {/* Background Imagery Decor */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <img
            alt="Ancient medieval manuscript texture background"
            className="w-full h-full object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuGtYbj8NVAUnne2ODOiLjkht6x-wB15IMP9UN02gmvee38PH9-ikLjBXlPC4Dantqx7XNlH33JHblYB7pfe7v7weGh7loKwzRdXl6khoFM1zCX1wsHO4sbv_7WleZ28fEzoMM8mib9GgM6K2-KPaWuy_8S4O0N2hpEc93NJcw6auViH9YUoTV3BXkgB6cmApludQirMdIkn0WFVdk6vN_fMDKYT5tigRQSBIz_bAAYGUnsz8rLLS4vNAnxxxk84a8wBFTsziv7YQ"
          />
        </div>

        {/* Registration Container (The Royal Enrollment Document) */}
        <div className="w-full max-w-xl relative z-10 bg-surface border-4 border-primary p-8 sm:p-12 shadow-2xl">
          {/* Ornamental Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-8 border-l-8 border-primary-container -translate-x-2 -translate-y-2"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-8 border-r-8 border-primary-container translate-x-2 -translate-y-2"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-8 border-l-8 border-primary-container -translate-x-2 translate-y-2"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-8 border-r-8 border-primary-container translate-x-2 translate-y-2"></div>

          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-block mb-4">
              <span
                className="material-symbols-outlined text-primary text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                history_edu
              </span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl font-extrabold text-on-surface uppercase tracking-tighter mb-2">
              Royal Enrollment
            </h1>
            <p className="font-serif italic text-on-surface-variant text-lg">
              Harken! Secure thy place in the Great Ledger of the Realm.
            </p>
            <div className="h-1 w-24 bg-primary mx-auto mt-4"></div>
          </div>

          {(error || success) && (
            <div className={`p-4 mb-6 border-l-4 text-sm font-bold ${error ? 'bg-error-container text-on-error-container border-error' : 'bg-primary-container text-on-primary-container border-primary'}`}>
              {error || success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grid for Name/Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name Field */}
              <div className="relative group">
                <label className="block font-headline font-bold text-primary uppercase tracking-widest text-xs mb-1" htmlFor="name">
                  Full Name
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-outline focus:ring-0 focus:border-primary-container transition-colors py-2 px-0 font-body text-lg placeholder:text-outline-variant placeholder:italic outline-none"
                  id="name"
                  name="name"
                  placeholder="Sir Alistair of Thorne"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              {/* Email Field */}
              <div className="relative group">
                <label className="block font-headline font-bold text-primary uppercase tracking-widest text-xs mb-1" htmlFor="email">
                  Coded Address (Email)
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-outline focus:ring-0 focus:border-primary-container transition-colors py-2 px-0 font-body text-lg placeholder:text-outline-variant placeholder:italic outline-none"
                  id="email"
                  name="email"
                  placeholder="scribe@realm.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative group">
                <label className="block font-headline font-bold text-primary uppercase tracking-widest text-xs mb-1" htmlFor="password">
                  Secret Cipher
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-outline focus:ring-0 focus:border-primary-container transition-colors py-2 px-0 font-body text-lg placeholder:text-outline-variant outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="relative group">
                <label className="block font-headline font-bold text-primary uppercase tracking-widest text-xs mb-1" htmlFor="confirm_password">
                  Re-seal Cipher
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-outline focus:ring-0 focus:border-primary-container transition-colors py-2 px-0 font-body text-lg placeholder:text-outline-variant outline-none"
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 py-2">
              <div className="mt-1">
                <input
                  className="w-5 h-5 bg-surface-container border-2 border-outline text-primary focus:ring-primary-container cursor-pointer"
                  id="terms"
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <label className="text-sm italic text-on-surface-variant leading-tight cursor-pointer" htmlFor="terms">
                I hereby swear fealty to the realm's <a className="text-primary font-bold underline decoration-primary-container/40" href="#">Decrees of Conduct</a> and the <a className="text-primary font-bold underline decoration-primary-container/40" href="#">Sanctity of Data</a>.
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-4">
              <button
                className={`w-full bg-primary text-on-primary py-4 font-headline font-extrabold text-xl uppercase tracking-widest bevel-wood hover:bg-primary-container transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={loading}
              >
                <span className="material-symbols-outlined text-2xl">shield</span>
                {loading ? 'Joining...' : 'Join the Ranks'}
              </button>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-outline-variant"></div>
                <span className="flex-shrink mx-4 text-xs font-headline font-bold text-outline uppercase tracking-widest">
                  Or authenticate via
                </span>
                <div className="flex-grow border-t border-outline-variant"></div>
              </div>

              {/* Google Pixel Auth Button */}
              <button
                className="w-full bg-tertiary text-on-tertiary py-4 font-headline font-bold text-lg uppercase tracking-wider bevel-stone hover:bg-tertiary-container transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3"
                type="button"
              >
                <span className="material-symbols-outlined text-2xl">token</span>
                Google Sigil
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="font-serif text-on-surface-variant">
              Already a member of the cohort?{' '}
              <Link className="text-primary font-bold hover:text-primary-container transition-colors underline underline-offset-4" to="/login">
                Return to the Tavern
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-200 dark:bg-stone-800 border-t-2 border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center py-12 px-4 space-y-4">
        <div className="text-lg font-bold text-stone-900 dark:text-stone-100 font-headline uppercase tracking-widest">
          Crest & Chronicle
        </div>
        <div className="flex space-x-6">
          <a className="font-serif text-sm italic text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity" href="#">
            Terms of Service
          </a>
          <a className="font-serif text-sm italic text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity" href="#">
            Privacy Policy
          </a>
          <a className="font-serif text-sm italic text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-opacity" href="#">
            Support
          </a>
        </div>
        <div className="font-serif text-sm italic text-stone-700 dark:text-stone-300 mt-4 opacity-80">
          © 1242 The Chronicler’s Ledger. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Register;
