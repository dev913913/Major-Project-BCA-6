import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-lg font-bold text-transparent">Codev - Created by Dev Kumar</h2>
          <p className="mt-2 text-sm text-slate-600">A modern learning platform for mastering programming through practical lessons.</p>
          <p className="mt-3 text-xs text-slate-500">© 2026 Dev Kumar. All rights reserved.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-600 lg:items-end">
          <div className="flex flex-wrap gap-4">
            <Link className="modern-link" to="/">Home</Link>
            <Link className="modern-link" to="/lessons">Lessons</Link>
            <Link className="modern-link" to="/categories">Categories</Link>
            <Link className="modern-link" to="/admin">Admin</Link>
          </div>
          <p className="text-xs">Social: LinkedIn · <a href="https://github.com/dev913913">GitHub</a> · YouTube</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
