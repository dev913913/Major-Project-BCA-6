import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItem = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-indigo-600' : 'text-slate-700 hover:text-indigo-600'}`;

function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur transition ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="text-xl font-black tracking-tight text-indigo-600">ProgLearn</span>
          <span className="text-xs text-slate-500">by Dev Kumar</span>
        </Link>

        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1 text-sm md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/" className={navItem}>
            Home
          </NavLink>
          <NavLink to="/lessons" className={navItem}>
            Lessons
          </NavLink>
          <NavLink to="/categories" className={navItem}>
            Categories
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navItem}>
              Admin
            </NavLink>
          )}
          {!user ? (
            <NavLink to="/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              Login
            </NavLink>
          ) : (
            <button type="button" className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={signOut}>
              Logout
            </button>
          )}
        </nav>
      </div>

      {mobileOpen && (
        <nav className="space-y-2 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <NavLink to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-700">
            Home
          </NavLink>
          <NavLink to="/lessons" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-700">
            Lessons
          </NavLink>
          <NavLink to="/categories" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-700">
            Categories
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-700">
              Admin
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
