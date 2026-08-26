import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Codev - Created by Dev Kumar</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">A modern learning platform for mastering programming through practical lessons.</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">© 2026 Dev Kumar. All rights reserved.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 lg:items-end">
          <div className="flex flex-wrap gap-3">
            <Link to="/">Home</Link>
            <Link to="/lessons">Lessons</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/admin">Admin</Link>
          </div>
          <p className="text-xs">Social: <a href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://in.linkedin.com/in/dev-kumar-186288242&ved=2ahUKEwiMscfT3b6WAxUWUGwGHadKKTIQFnoFCIcBEAE&usg=AOvVaw2wQljXhf5Af8l_xKmhhZux" target="_blank" rel="noopener noreferrer">Github</a>
 · <a href="https://github.com/dev913913" target="_blank" rel="noopener noreferrer">GitHub</a> · <a href="https://youtube.com/@bewakoofenglish-wo8ze?si=N8KELM2MAakTjvoo" target="_blank" rel="noopener noreferrer">YouTube</a></p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
