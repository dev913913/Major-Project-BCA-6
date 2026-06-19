import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItem = ({ isActive }) =>
  `rounded-lg px-2 py-1 text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`;
const mobileNavItem = ({ isActive }) =>
  `block rounded-lg px-2 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
  }`;

function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    setMobileOpen(false);
    navigate('/', { replace: true });
  }

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition ${scrolled ? 'shadow-lg shadow-slate-900/5' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-black tracking-tight text-transparent">Codev</span>
          <span className="text-xs text-slate-500">by Dev Kumar</span>
        </Link>

        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-slate-50 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>

        <nav className="hidden items-center gap-2 md:flex">
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
            <NavLink to="/login" className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700">
              Login
            </NavLink>
          ) : (
            <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={handleSignOut}>
              Logout
            </button>
          )}
        </nav>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="space-y-2 border-t border-slate-200 bg-white px-4 py-3 md:hidden"
        >
          <NavLink to="/" onClick={() => setMobileOpen(false)} className={mobileNavItem}>
            Home
          </NavLink>
          <NavLink to="/lessons" onClick={() => setMobileOpen(false)} className={mobileNavItem}>
            Lessons
          </NavLink>
          <NavLink to="/categories" onClick={() => setMobileOpen(false)} className={mobileNavItem}>
            Categories
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={mobileNavItem}>
              Admin
            </NavLink>
          )}
          {!user ? (
            <NavLink to="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600">
              Login
            </NavLink>
          ) : (
            <button type="button" onClick={handleSignOut} className="block text-sm font-medium text-slate-700">
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
