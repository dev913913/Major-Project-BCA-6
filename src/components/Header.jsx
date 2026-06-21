import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItem = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300'}`;
const mobileNavItem = ({ isActive }) =>
  `block rounded-lg px-2 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
  }`;


function ThemeToggle({ isDark, onToggle, compact = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:text-indigo-300 ${compact ? 'px-2.5' : ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span aria-hidden="true">{isDark ? '☾' : '☀'}</span>
      {!compact && <span>{isDark ? 'Dark' : 'Light'}</span>}
    </button>
  );
}

function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

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
    <header className={`sticky top-0 z-50 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur transition ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-300">Codev</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">by Dev Kumar</span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} compact />
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
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
            <button type="button" className="rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200" onClick={handleSignOut}>
              Logout
            </button>
          )}
        </nav>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 md:hidden"
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
            <NavLink to="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600 dark:text-indigo-300">
              Login
            </NavLink>
          ) : (
            <button type="button" onClick={handleSignOut} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Logout
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
