import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          ProgLearn CMS
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/" className="text-slate-700 hover:text-indigo-600">
            Lessons
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="text-slate-700 hover:text-indigo-600">
              Admin
            </NavLink>
          )}
          {!user ? (
            <NavLink to="/login" className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white">
              Login
            </NavLink>
          ) : (
            <button
              type="button"
              className="rounded bg-slate-200 px-3 py-1.5 font-medium text-slate-700"
              onClick={signOut}
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
