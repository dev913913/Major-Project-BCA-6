import { Link } from 'react-router-dom';
import { useSeo } from '../components/Seo';

function NotFoundPage() {
  useSeo({
    title: 'Page not found | Codev by Dev Kumar',
    description: 'The page you are looking for could not be found on Codev.',
    type: 'website',
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">404 Error</p>
      <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
        The page may have moved or no longer exists. Use one of the quick links below to continue learning.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Go home
        </Link>
        <Link
          to="/lessons"
          className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50"
        >
          Browse lessons
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
