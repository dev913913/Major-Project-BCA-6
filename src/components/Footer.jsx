import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">ProgLearn - Created by Dev Kumar</h2>
          <p className="mt-2 text-sm text-slate-600">A modern learning platform for mastering programming through practical lessons.</p>
          <p className="mt-3 text-xs text-slate-500">© 2026 Dev Kumar. All rights reserved.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-600 lg:items-end">
          <div className="flex flex-wrap gap-3">
            <Link to="/">Home</Link>
            <Link to="/lessons">Lessons</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/admin">Admin</Link>
          </div>
          <p className="text-xs">Social: LinkedIn · <a href="https://github.com/dev913913"GitHub</a> · YouTube</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
